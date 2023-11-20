import { Uri, workspace } from 'vscode';
import { CodeChange, DocumentInfo, Include } from './document-info';
import { documents } from './extension';
import { getOriginalRangeFromOffset } from './utility';

export async function preprocess(di: DocumentInfo): Promise<string> {
    let text = di.document.getText();
    text = resolveNewLine(di, text);
    text = resolveLineContinuation(di, text);
    text = resolveComment(di, text);
    text = await resolveInclude(di, text);
    text = resolveMacro(di, text);
    return text;
}

function resolveNewLine(di: DocumentInfo, text: string): string {
    let result: RegExpMatchArray;
    while ((result = text.match(/\r(?=\n)/))) {
        const cc = new CodeChange();
        cc.position = result.index;
        cc.offset = -1;
        updateOffsets(di, cc, result.index + 1, result.index);
        di.cc.push(cc);
        text = text.substring(0, result.index) + text.substring(result.index + 1);
    }
    return text;
}

function resolveLineContinuation(di: DocumentInfo, text: string): string {
    let result: RegExpMatchArray;
    while ((result = text.match(/\\\n/))) {
        const cc = new CodeChange();
        cc.position = result.index;
        cc.offset = -2;
        updateOffsets(di, cc, result.index + 2, result.index);
        di.cc.push(cc);
        text = text.substring(0, result.index) + text.substring(result.index + 2);
    }
    return text;
}

function resolveComment(di: DocumentInfo, text: string): string {
    let result: RegExpMatchArray;
    while ((result = text.match(/\/\*(.|\n)*?\*\/|\/\/.*?(?=\n)/))) {
        const cc = new CodeChange();
        cc.position = result.index;
        cc.offset = -result[0].length + 1;
        updateOffsets(di, cc, result.index + result[0].length, result.index + 1);
        di.cc.push(cc);
        text = text.substring(0, result.index) + ' ' + text.substring(result.index + result[0].length);
    }
    return text;
}



async function resolveInclude(di: DocumentInfo, text: string): Promise<string> {
    let result: RegExpMatchArray;
    while ((result = text.match(/(#\s*include(\s|\/\*.*?\*\/)*")(?<name>.*?)"/))) {
        if (result.groups) {
            const name = result.groups['name'];
            const includedText = await getIncludedText(name, di);
            const cc = new CodeChange();
            cc.position = result.index;
            cc.offset = -result[0].length + includedText.length;

            const include = new Include();
            include.name = name;
            const startOffset = result.index + result[1].length;
            const endOffset = result.index + result[1].length + name.length;
            include.originalRange = getOriginalRangeFromOffset(di, startOffset, endOffset);
            updateOffsets(di, cc, result.index + result[0].length, result.index + includedText.length);
            di.includes.push(include);

            di.cc.push(cc);
            text = text.substring(0, result.index) + includedText + text.substring(result.index + result[0].length);
        }
    }
    return text;
}

async function getIncludedText(name: string, di: DocumentInfo): Promise<string> {
    const uri = Uri.joinPath(di.document.uri, '..', name);
    const includedDi = documents.get(uri.fsPath);
    if (includedDi) {
        return includedDi.document.getText();
    } else {
        try {
            const includedDocument = await workspace.openTextDocument(uri);
            return includedDocument.getText();
        } catch (error) {
            // included file doesn't exist
        }
        return '';
    }
}

function resolveMacro(di: DocumentInfo, text: string): string {
    // let result: RegExpMatchArray;
    // while ((result = text.match(/[a-zA-Z_]\w*/))) {
    //     const cc = new CodeChange();
    //     cc.position = result.index;
    //     cc.offset = -1;
    //     updateOffsets(di, cc, result.index + 1, result.index);
    //     di.cc.push(cc);
    //     text = text.substring(0, result.index) + text.substring(result.index + 1);
    // }
    return text;
}

function updateOffsets(di: DocumentInfo, cc: CodeChange, endOffset: number, newEnd: number): void {
    for (const cc2 of di.cc) {
        if (endOffset < cc2.position) {
            cc2.position += cc.offset;
        } else if (cc.position <= cc2.position && cc2.position <= endOffset) {
            cc2.position = newEnd;
        }
        // if (cc.position <= cc2.position) {
        //     cc2.position += cc.offset;
        // }
    }
}

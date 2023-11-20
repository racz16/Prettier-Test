import {
    DocumentSelector,
    ExtensionContext,
    Position,
    Range,
    TextDocument,
    Uri,
    ViewColumn,
    commands,
    languages,
    window,
    workspace,
} from 'vscode';
import { DocumentInfo, VariableDeclaration, VariableUsage } from './document-info';
import { preprocess } from './preprocessor';
import { AsdCompletionItemProvider } from './provider/completion-provider';
import { AsdDeclarationProvider } from './provider/declaration-provider';
import { AsdDefinitionProvider } from './provider/definition-provider';
import { AsdDocumentHighlightProvider } from './provider/document-highlight-provider';
import { AsdDocumentLinkProvider } from './provider/document-link-provider';
import { AsdDocumentSymbolProvider } from './provider/document-symbol-provider';
import { AsdFileDecorationProvider } from './provider/file-decoration-provider';
import { AsdHoverProvider } from './provider/hover-provider';
import { AsdReferenceProvider } from './provider/reference-provider';
import { AsdRenameProvider } from './provider/rename-provider';
import { AsdTextDocumentContentProvider } from './provider/text-document-content-provider';
import { getOriginalRange, handleRegexResult } from './utility';

export const documents = new Map<string, DocumentInfo>();

export function getDocument(uri: Uri): DocumentInfo {
    const di = documents.get(uri.fsPath);
    if (di) {
        return di;
    }
    for (const di of documents.values()) {
        if (uri.fsPath === di.document.uri.fsPath) {
            const preprocessedDi = new DocumentInfo();
            preprocessedDi.document = di.document;
            documents.set(uri.fsPath, preprocessedDi);
            return preprocessedDi;
        }
    }
    return null;
}

export async function analyze(document: TextDocument): Promise<void> {
    let di = documents.get(document.uri.fsPath);
    if (!di) {
        di = new DocumentInfo();
        di.document = document;
        documents.set(document.uri.fsPath, di);
    }
    if (di.version === document.version) {
        return;
    }
    di.version = document.version;
    di.declarations = [];
    di.usages = [];
    di.includes = [];
    di.cc = [];
    let text = document.getText();
    di.preprocessedText = preprocess(di);
    text = await di.preprocessedText;
    addVariableDeclarations(text, di);
    addVariableUsages(text, di);
}

function addVariableDeclarations(text: string, di: DocumentInfo): void {
    const declarationPattern = /((?<type>\w+)(\s|\/\*.*?\*\/)+)(?<variable>\w+)(\s|\/\*.*?\*\/)*;/g;
    handleRegexResult(text, declarationPattern, (result, line, position) => {
        const type = result.groups['type'];
        const variable = result.groups['variable'];
        const declaration = new VariableDeclaration();
        declaration.type = type;
        declaration.name = variable;
        declaration.range = new Range(
            new Position(line, position + result[1].length),
            new Position(line, position + result[1].length + variable.length)
        );
        declaration.originalRange = getOriginalRange(di, text, declaration.range);
        di.declarations.push(declaration);
    });
}

function addVariableUsages(text: string, di: DocumentInfo): void {
    const usagePattern = /((?<v1>\w+)(\s|\/\*.*?\*\/)*=(\s|\/\*.*?\*\/)*)(?<v2>\w+)(\s|\/\*.*?\*\/)*;/g;
    handleRegexResult(text, usagePattern, (result, line, position) => {
        const v1 = result.groups['v1'];
        const usage1 = new VariableUsage();
        const declaration1 = di.declarations.find((d) => d.name === v1) ?? null;
        usage1.declaration = declaration1;
        usage1.name = v1;
        usage1.range = new Range(new Position(line, position), new Position(line, position + v1.length));
        usage1.originalRange = getOriginalRange(di, text, usage1.range);
        declaration1?.usages.push(usage1);
        di.usages.push(usage1);

        const v2 = result.groups['v2'];
        const usage2 = new VariableUsage();
        const declaration2 = di.declarations.find((d) => d.name === v2) ?? null;
        usage2.declaration = declaration2;
        usage2.name = v2;
        usage2.range = new Range(
            new Position(line, position + result[1].length),
            new Position(line, position + result[1].length + v2.length)
        );
        usage2.originalRange = getOriginalRange(di, text, usage2.range);
        declaration2?.usages.push(usage2);
        di.usages.push(usage2);
    });
}

export function activate(context: ExtensionContext): void {
    console.log(context.extensionMode);
    addCommands(context);
    addFeatures(context);
}

export function addCommands(context: ExtensionContext): void {
    context.subscriptions.push(
        commands.registerCommand('asd-language-support.generatepreprocessed', async () => {
            const document = window.activeTextEditor.document;
            if (document?.languageId !== 'asd') {
                window.showWarningMessage('The active file has to be an ASD file.');
            } else {
                const uri = Uri.parse(`asd-language-support-preprocessed:${document.fileName}`);
                // GlslEditor.getDocumentInfo(uri).setPreprocessedText(preprocessedText);
                AsdTextDocumentContentProvider.onDidChangeEmitter.fire(uri);
                await window.showTextDocument(uri, { preview: false, viewColumn: ViewColumn.Beside });
            }
        })
    );
}

export function addFeatures(context: ExtensionContext): void {
    const selector: DocumentSelector = [{ language: 'asd' }];

    //preprocessed asd
    context.subscriptions.push(
        workspace.registerTextDocumentContentProvider(
            'asd-language-support-preprocessed',
            new AsdTextDocumentContentProvider()
        )
    );
    window.registerFileDecorationProvider(new AsdFileDecorationProvider());

    //hover
    context.subscriptions.push(languages.registerHoverProvider(selector, new AsdHoverProvider()));
    //highlight
    context.subscriptions.push(
        languages.registerDocumentHighlightProvider(selector, new AsdDocumentHighlightProvider())
    );
    //completion
    context.subscriptions.push(languages.registerCompletionItemProvider(selector, new AsdCompletionItemProvider()));
    //symbols
    context.subscriptions.push(languages.registerDocumentSymbolProvider(selector, new AsdDocumentSymbolProvider()));
    //declaration
    context.subscriptions.push(languages.registerDeclarationProvider(selector, new AsdDeclarationProvider()));
    //definition
    context.subscriptions.push(languages.registerDefinitionProvider(selector, new AsdDefinitionProvider()));
    //reference
    context.subscriptions.push(languages.registerReferenceProvider(selector, new AsdReferenceProvider()));
    //rename
    context.subscriptions.push(languages.registerRenameProvider(selector, new AsdRenameProvider()));
    //document link
    context.subscriptions.push(languages.registerDocumentLinkProvider(selector, new AsdDocumentLinkProvider()));
}

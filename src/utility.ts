import { Position, Range } from 'vscode';
import { DocumentInfo } from './document-info';

export function offsetToPosition(text: string, offset: number): Position {
    const lines = text.split('\n');
    let characterCount = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (characterCount + line.length >= offset) {
            const position = offset - characterCount;
            return new Position(i, position);
        } else {
            characterCount += line.length + 1;
        }
    }
    return null;
}

export function positionToOffset(text: string, position: Position): number {
    const lines = text.split('\n');
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (i === position.line) {
            return offset + position.character;
        } else {
            offset += line.length + 1;
        }
    }
    return -1;
}

export function getOriginalRange(di: DocumentInfo, preprocessedText: string, range: Range): Range {
    const startPositionOffset = positionToOffset(preprocessedText, range.start);
    const endPositionOffset = positionToOffset(preprocessedText, range.end);
    return getOriginalRangeFromOffset(di, startPositionOffset, endPositionOffset);
}

export function getOriginalRangeFromOffset(
    di: DocumentInfo,
    startPositionOffset: number,
    endPositionOffset: number
): Range {
    const startOffset = di.cc
        .filter((c) => c.position <= startPositionOffset)
        .map((c) => c.offset)
        .reduce((prev, curr) => prev + curr, 0);
    const endOffset = di.cc
        .filter((c) => c.position <= endPositionOffset)
        .map((c) => c.offset)
        .reduce((prev, curr) => prev + curr, 0);
    const originalStartPositionOffset = startPositionOffset - startOffset;
    const originalEndPositionOffset = endPositionOffset - endOffset;
    const originalStartPosition = di.document.positionAt(originalStartPositionOffset);
    const originalEndPosition = di.document.positionAt(originalEndPositionOffset);
    return new Range(originalStartPosition, originalEndPosition);
}

export function handleRegexResult(
    text: string,
    regex: RegExp,
    callback: (result: RegExpMatchArray, line: number, position: number) => void
): void {
    for (const regexResult of text.matchAll(regex)) {
        if (regexResult?.groups) {
            const index = regexResult.index;
            const lines = text.split('\n');
            let characterCount = 0;
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                if (characterCount + line.length >= index) {
                    const position = index - characterCount;
                    callback(regexResult, i, position);
                    break;
                } else {
                    characterCount += line.length + 1;
                }
            }
        }
    }
}

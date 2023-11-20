import { Position, Range, TextDocument } from 'vscode';

export class DocumentInfo {
    public version = -1;

    public document: TextDocument;
    public declarations: VariableDeclaration[] = [];
    public usages: VariableUsage[] = [];
    public includes: Include[] = [];
    public cc: CodeChange[] = [];

    public preprocessedText: Promise<string>;

    public getDeclaration(position: Position): VariableDeclaration {
        return this.declarations.find((d) => d.originalRange.contains(position));
    }

    public getUsage(position: Position): VariableUsage {
        return this.usages.find((u) => u.originalRange.contains(position));
    }
}

export class VariableDeclaration {
    public range: Range;
    public originalRange: Range;
    public type: string;
    public name: string;
    public usages: VariableUsage[] = [];
}

export class VariableUsage {
    public range: Range;
    public originalRange: Range;
    public name: string;
    public declaration: VariableDeclaration;
}

export class Include {
    public range: Range;
    public originalRange: Range;
    public name: string;
}

export class CodeChange {
    public position: number;
    public offset: number;
}

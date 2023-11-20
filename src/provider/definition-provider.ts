import {
    CancellationToken,
    Definition,
    DefinitionLink,
    DefinitionProvider,
    Location,
    Position,
    TextDocument,
} from 'vscode';
import { analyze, documents } from '../extension';

export class AsdDefinitionProvider implements DefinitionProvider {
    public async provideDefinition(
        document: TextDocument,
        position: Position,
        token: CancellationToken
    ): Promise<Definition | DefinitionLink[]> {
        await analyze(document);
        const di = documents.get(document.uri.fsPath);
        const usage = di.getUsage(position);
        if (usage?.declaration) {
            return new Location(document.uri, usage.declaration.originalRange);
        }
        return null;
    }
}

import { CancellationToken, FileDecoration, FileDecorationProvider, ProviderResult, Uri } from 'vscode';

export class AsdFileDecorationProvider implements FileDecorationProvider {
    public provideFileDecoration(uri: Uri, token: CancellationToken): ProviderResult<FileDecoration> {
        if (uri.scheme === 'asd-language-support-preprocessed') {
            const fd = new FileDecoration();
            fd.tooltip = 'This is the read-only view of the preprocessed ASD source code.';
            fd.badge = 'P';
            return fd;
        } else {
            return null;
        }
    }
}

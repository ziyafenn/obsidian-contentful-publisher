import { App, Modal, Setting } from "obsidian";
import { ContentfulApiError } from "./types";
import strings from "./strings";

export class ErrorModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}

	showError(error: ContentfulApiError) {
		this.titleEl.setText(strings.contentfulErrorTitle);
		this.contentEl.setText(
			`Status ${error.status}: ${error.message}
            ${strings.contentfulErrorBody}`
		);
		this.open();
	}

	showOutOfSyncError(files: string[]) {
		this.titleEl.setText("Sync error");
		this.contentEl.setText(
			`Files "${files.join(
				", "
			)}" are out of sync. Copy of old files was created.`
		);
		new Setting(this.contentEl).addButton((btn) =>
			btn.setButtonText("Close").onClick(() => {
				this.close();
			})
		);
		this.open();
	}
}

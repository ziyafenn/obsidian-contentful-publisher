export class SettingsMessage {
	private containerEl: HTMLElement;
	private div: HTMLDivElement;

	constructor(containerEl: HTMLElement) {
		this.containerEl = containerEl;
		this.div = this.containerEl.createEl("div", { cls: "errorContainer" });
	}

	show(title: string, message: string) {
		this.empty();
		this.div.show();
		this.div.createEl("h2", { text: title });
		this.div.createEl("small", { text: message });
	}
	empty() {
		this.div.empty();
	}
	hide() {
		this.div.hide();
	}
}

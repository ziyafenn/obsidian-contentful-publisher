import ContentfulPublisher from "main";
import { Setting } from "obsidian";
import strings from "src/strings";
import { ContentTypes } from "src/types";

export const dislpayFieldConfigSettings = (
	contentTypes: ContentTypes,
	containerEl: HTMLElement,
	plugin: ContentfulPublisher
) => {
	const div = containerEl.createEl("div", { cls: "fieldConfig" });

	const onSave = () => {
		let notSelected: string[] = [];
		const ctaDiv = div.querySelector(".cta")!;
		const ctaDesk = ctaDiv.querySelector(".setting-item-description");

		contentTypes.forEach((contentType) => {
			const selectParent = div.querySelector(
				`.select-${contentType.sys.id}`
			);
			const select = selectParent?.querySelector("select")!;

			if (select.options.selectedIndex === -1) {
				notSelected.push(contentType.name);
			}
		});
		if (notSelected.length === 0) {
			plugin.isSetupComplete = true;
			plugin.saveSettings();
			ctaDesk!.textContent = strings.saveSuccess;
		} else {
			ctaDesk!.textContent = strings.saveError;
		}
	};

	new Setting(div).setHeading().setName(strings.fieldsSectionTitle);

	for (const contentType of contentTypes) {
		new Setting(div)
			.setName(contentType.name)
			.addDropdown((dropdown) => {
				const filteredOptions = contentType.fields.filter(
					(field) => field.type === "Text"
				);
				const options = filteredOptions.reduce(
					(acc, field) => ({ ...acc, [field.id]: field.name }),
					{}
				);
				dropdown
					.addOptions(options)
					.setValue(plugin.settings.bodyFieldIDs[contentType.sys.id])
					.onChange(async (value) => {
						plugin.settings.bodyFieldIDs[contentType.sys.id] =
							value;
					});
			})
			.setClass(`select-${contentType.sys.id}`);
	}
	new Setting(div).setClass("cta").addButton((btn) =>
		btn
			.setButtonText("Save settings")
			.setCta()
			.onClick(() => onSave())
	);
};

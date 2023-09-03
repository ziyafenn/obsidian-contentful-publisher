import ContentfulPublisher from "main";
import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import ContentfulService from "../contentfulClient";
import { getTemplatesFolderName } from "../getTemplatesFolderName";
import { SettingsMessage } from "./settingsMessage";
import { dislpayFieldConfigSettings } from "./fieldConfigSettings";
import { ContentfulApiError, PluginSettings } from "src/types";
import { isJSONString } from "src/utilities";
import strings from "src/strings";

type Fields = {
	[K in Exclude<
		keyof PluginSettings,
		"bodyFieldIDs" | "titleFieldIDs" | "ignoredFieldIDs" | "defaultLocale"
	>]: boolean;
};

export default class ContentfulSettingTab extends PluginSettingTab {
	plugin: ContentfulPublisher;
	settings: typeof this.plugin.settings;
	containerEl: HTMLElement;
	templatesFolderName: string | undefined;
	fieldValidation: Fields;
	settingsMessage: SettingsMessage;

	constructor(app: App, plugin: ContentfulPublisher) {
		super(app, plugin);
		this.plugin = plugin;
		this.settings = this.plugin.settings;
		this.fieldValidation = {
			environmentID: !!this.settings.environmentID,
			spaceID: !!this.settings.spaceID,
			contentManagementToken: !!this.settings.contentManagementToken,
		};
	}

	async getContentTypes() {
		return await this.plugin.contentful.getContentTypes(this.plugin);
	}

	async onSubmit(div: HTMLDivElement) {
		const ctaDiv = div.querySelector(".cta")!;
		const ctaDesk = ctaDiv.querySelector(".setting-item-description");
		const fieldConfig = this.containerEl.querySelector(".fieldConfig");
		const loading = new Notice("Checking connection to Contentful...", 0);
		if (Object.values(this.fieldValidation).includes(false)) {
			return this.settingsMessage.show(
				"Required Fields Missing",
				"Please complete all required fields before proceeding. An empty field was detected, and all fields must be filled in to continue."
			);
		}

		if (!this.templatesFolderName) {
			return this.settingsMessage.show(
				"Templates folder is missing",
				"It it appears that the 'Templates' folder is missing from your Obsidian setup. This folder is essential for managing templates effectively. To resolve this issue, please create a new folder in your Obsidian vault directory and use 'Templates' core plugin to set it up"
			);
		}
		try {
			this.plugin.contentful = new ContentfulService(
				this.settings.spaceID!,
				this.settings.contentManagementToken!,
				this.settings.environmentID
			);

			const contentTypes = await this.getContentTypes();

			if (!contentTypes) {
				return this.settingsMessage.show(
					strings.noContentModelsTitle,
					strings.noContentModelsBody
				);
			}

			await this.plugin.saveSettings();
			if (fieldConfig) fieldConfig.remove();
			this.settingsMessage.hide();
			dislpayFieldConfigSettings(
				contentTypes,
				this.containerEl,
				this.plugin
			);
			ctaDesk!.textContent = strings.saveSuccess;
		} catch (err) {
			ctaDesk!.textContent = strings.saveError;
			if (fieldConfig) fieldConfig.remove();

			if (!isJSONString(err.message)) {
				return this.settingsMessage.show(`${err.name}`, err.message);
			}

			const error: ContentfulApiError = JSON.parse(err.message);
			this.settingsMessage.show(
				strings.contentfulErrorTitle,
				`Status ${error.status}: ${error.message} ${strings.contentfulErrorBody}`
			);
		} finally {
			loading.hide();
		}
	}

	displayAPISettings() {
		const div = this.containerEl.createEl("div", { cls: "apiSettings" });

		new Setting(div).setHeading().setName("Contentful API");

		new Setting(div)
			.setName("Contentful Space ID")
			.setDesc(
				"This unique identifier helps us connect to your specific Contentful space where your content is managed"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your Space ID")
					.setValue(this.settings.spaceID ?? "")
					.onChange(async (value) => {
						this.fieldValidation.spaceID = !!value;
						this.settings.spaceID = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(div)
			.setName("Contentful Environment ID")
			.setDesc(
				"This ID specifies the environment within your Contentful space, helping us access the correct content environment. Defaults to 'master'"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your environment ID")
					.setValue(this.settings.environmentID ?? "")
					.onChange(async (value) => {
						this.fieldValidation.environmentID = !!value;
						this.settings.environmentID = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(div)
			.setName("Content Management API")
			.setDesc(
				"You can create CMA Token in your Contentful Account Settings"
			)
			.addText((text) =>
				text
					.setPlaceholder("Enter your CMA Token")
					.setValue(this.settings.contentManagementToken ?? "")
					.onChange(async (value) => {
						this.fieldValidation.contentManagementToken = !!value;
						this.settings.contentManagementToken = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(div)
			.setName("Template folder name")
			.setDesc(
				"Use Obsidian 'Templates' core plugin to setup your templates folder"
			)
			.addText((text) => {
				text.setDisabled(true)
					.setPlaceholder("No templates folder")
					.setValue(this.templatesFolderName ?? "");
			});

		new Setting(div).setClass("cta").addButton((btn) =>
			btn
				.setButtonText(
					this.plugin.isFirstStart
						? "Connect to Contentful"
						: "Reconnect"
				)
				.setCta()
				.onClick(() => this.onSubmit(div))
		);
	}

	async display() {
		this.containerEl.empty();
		this.templatesFolderName = getTemplatesFolderName(this.app.vault);
		this.displayAPISettings();
		this.settingsMessage = new SettingsMessage(this.containerEl);

		if (!this.plugin.isFirstStart) {
			this.settingsMessage.show(
				strings.fieldsSectionTitle,
				"Loading Contentful Content Models..."
			);
			try {
				this.plugin.contentful = new ContentfulService(
					this.settings.spaceID!,
					this.settings.contentManagementToken!,
					this.settings.environmentID
				);
				const contentTypes = await this.getContentTypes();

				if (!contentTypes)
					return this.settingsMessage.show(
						strings.noContentModelsTitle,
						strings.noContentModelsBody
					);
				this.settingsMessage.hide();
				dislpayFieldConfigSettings(
					contentTypes,
					this.containerEl,
					this.plugin
				);
			} catch (err) {
				if (!isJSONString(err.message)) {
					return this.settingsMessage.show(
						`${err.name}`,
						err.message
					);
				}

				const error: ContentfulApiError = JSON.parse(err.message);
				this.settingsMessage.show(
					strings.contentfulErrorTitle,
					`Status ${error.status}: ${error.message}
					${strings.contentfulErrorBody}`
				);
			}
		}
	}
}

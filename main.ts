import { Notice, Plugin } from "obsidian";
import {
	createNotesFromEntries,
	createTemplatesFromTypes,
} from "src/createNotes";
import { getTemplatesFolderName } from "src/getTemplatesFolderName";
import ContentfulService from "src/contentfulClient";
import ContentfulSettingTab from "src/settings/settingTab";
import { ContentfulApiError, PluginSettings } from "src/types";
import { ErrorModal } from "src/errorModal";
import { isJSONString } from "src/utilities";
import strings from "src/strings";
import { updateEntry } from "src/updateEntry";

const DEFAULT_SETTINGS: PluginSettings = {
	spaceID: "",
	contentManagementToken: "",
	environmentID: "master",
	bodyFieldIDs: {},
	titleFieldIDs: {},
	ignoredFieldIDs: {},
	defaultLocale: "",
};

export default class ContentfulPublisher extends Plugin {
	settings: PluginSettings;
	contentful: ContentfulService;
	isFirstStart: boolean;
	isSetupComplete: boolean;

	async onload() {
		await this.loadSettings();
		const modal = new ErrorModal(this.app);

		const vault = this.app.vault;
		const templatesFolderName = getTemplatesFolderName(vault);

		this.isFirstStart =
			!this.settings.spaceID &&
			!this.settings.contentManagementToken &&
			!this.settings.environmentID;
		this.isSetupComplete =
			!this.isFirstStart &&
			Object.keys(this.settings.bodyFieldIDs).length !== 0 &&
			Object.keys(this.settings.titleFieldIDs).length !== 0 &&
			!!this.settings.defaultLocale &&
			!!templatesFolderName;

		if (this.isSetupComplete) {
			this.contentful = new ContentfulService(
				this.settings.spaceID!,
				this.settings.contentManagementToken!,
				this.settings.environmentID
			);
		}
		this.addSettingTab(new ContentfulSettingTab(this.app, this));

		this.addCommand({
			id: "updateContentfulEntry",
			name: "Update Contentful entry",
			callback: async () => {
				const loading = new Notice(
					"Updating file... Might take some time.",
					0
				);
				try {
					const updatedEntry = await updateEntry(this.app, this);
					return new Notice(
						`Entry "${updatedEntry}" was successfully updated`
					);
				} catch (error) {
					if (
						error instanceof Error &&
						error.name === "OutOfSyncError"
					) {
						return modal.showOutOfSyncError([error.message]);
					}
					new Notice(error.message);
				} finally {
					loading.hide();
				}
			},
		});

		this.addRibbonIcon("refresh-ccw", "Sync with Contentful", async () => {
			if (!this.isSetupComplete)
				return new Notice("Plugin not configured");
			const loading = new Notice(
				"Syncing files with Contentful... Might take some time.",
				0
			);
			try {
				const contentTypes = await this.contentful.getContentTypes(
					this
				);
				const entries = await this.contentful.getEntries(this.settings);

				await createTemplatesFromTypes(
					contentTypes,
					vault,
					this.settings
				);
				const notes = await createNotesFromEntries(
					entries,
					vault,
					this.settings
				);

				if (notes.length > 0) return modal.showOutOfSyncError(notes);
				new Notice(strings.syncSuccess);
			} catch (err) {
				if (!isJSONString(err.message)) return new Notice(err.message);
				const error: ContentfulApiError = JSON.parse(err.message);
				modal.showError(error);
			} finally {
				loading.hide();
			}
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

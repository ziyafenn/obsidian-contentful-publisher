import { createClient, Entry, PlainClientAPI } from "contentful-management";
import ContentfulPublisher from "main";
import { ignoredFieldTypes, Entries, PluginSettings } from "./types";

export default class ContentfulService {
	private readonly client: PlainClientAPI;

	constructor(space: string, accessToken: string, environmentID: string) {
		this.client = createClient(
			{
				accessToken: accessToken,
			},
			{
				type: "plain",
				defaults: {
					spaceId: space,
					environmentId: environmentID,
				},
			}
		);
	}

	async getContentTypes(plugin: ContentfulPublisher) {
		const contentTypes = await this.client.contentType.getMany({
			environmentId: plugin.settings.environmentID,
		});

		const locales = await this.client.locale.getMany({});
		const defaultLocale = locales.items.find(
			(locale) => locale.default === true
		)?.code;
		plugin.settings.defaultLocale = defaultLocale!;
		const filteredContentTypes = contentTypes.items.map((contentType) => {
			const ignoredFields = contentType.fields.filter((field) =>
				ignoredFieldTypes.includes(
					field.type as any as (typeof ignoredFieldTypes)[number]
				)
			);

			const allowedFields = contentType.fields.filter(
				(field) =>
					!ignoredFieldTypes.includes(
						field.type as any as (typeof ignoredFieldTypes)[number]
					)
			);

			const entryTitle = contentType.displayField;

			if (!entryTitle) {
				const error = new Error(
					"Some Content Types are missing Entry Title field"
				);
				error.name = "EntryTitleError";
				throw error;
			}

			plugin.settings.ignoredFieldIDs[contentType.sys.id] =
				ignoredFields.map((field) => field.id);
			plugin.settings.titleFieldIDs[contentType.sys.id] = entryTitle;

			return { ...contentType, fields: allowedFields };
		});
		plugin.saveSettings();
		return filteredContentTypes;
	}

	async getEntries(settings: PluginSettings) {
		const entries = await this.client.entry.getMany({
			environmentId: settings.environmentID,
		});
		const ignoredFieldIDs = settings.ignoredFieldIDs;
		const filteredEntries = entries.items.map((item) => {
			const contentTypeIgnoredFields =
				ignoredFieldIDs[item.sys.contentType.sys.id];

			item.fields = Object.fromEntries(
				Object.entries(item.fields).filter(
					([key]) => !contentTypeIgnoredFields.includes(key)
				)
			);
			return item;
		});
		return filteredEntries;
	}

	async getEntry(entryID: string) {
		return await this.client.entry.get({ entryId: entryID });
	}

	async updatedEntry(entryID: string, entry: Entries[number]) {
		return await this.client.entry.update({ entryId: entryID }, entry);
	}
}

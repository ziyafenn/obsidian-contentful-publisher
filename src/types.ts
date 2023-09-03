import ContentfulService from "./contentfulClient";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

export interface PluginSettings {
	spaceID: string;
	contentManagementToken: string;
	defaultLocale: string;
	environmentID: string;
	bodyFieldIDs: Record<string, string>;
	titleFieldIDs: Record<string, string>;
	ignoredFieldIDs: Record<string, string[]>;
}

export interface ContentfulApiError {
	details: Record<string, any>;
	message: string;
	request: {
		url: string;
		headers: Record<string, string>;
		method: string;
	};
	requestId: string;
	status: number;
	statusText: string;
}

export type ContentTypes = UnwrapPromise<
	ReturnType<ContentfulService["getContentTypes"]>
>;
export type Entries = UnwrapPromise<
	ReturnType<ContentfulService["getEntries"]>
>;

export const ignoredFieldTypes = [
	"Link",
	"Object",
	"ResourceLink",
	"RichText",
	"Location",
] as const;
export const allowedFieldTypes = [
	"Symbol",
	"Text",
	"Integer",
	"Number",
	"Date",
	"Boolean",
	"Array",
] as const;

export const fieldTypes = [...ignoredFieldTypes, ...allowedFieldTypes] as const;

export type ObsidianParamTypes =
	| "text"
	| "multitext"
	| "number"
	| "checkbox"
	| "date"
	| "datetime"
	| "tags";

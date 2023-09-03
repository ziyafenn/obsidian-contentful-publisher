import { FileSystemAdapter, Vault } from "obsidian";
import * as fs from "fs";
import * as path from "path";
import { ObsidianParamTypes, allowedFieldTypes } from "./types";

export const writeToTypes = (
	vault: Vault,
	fieldTypes: Map<string, ObsidianParamTypes>
) => {
	const configDir = vault.configDir;
	const adapter = vault.adapter;
	const basePath = (adapter as FileSystemAdapter).getBasePath();
	const filePath = path.join(basePath, configDir, "types.json");
	fieldTypes.set("entryId", "text").set("tags", "tags");

	if (filePath) {
		const file = fs.readFileSync(filePath, "utf-8");
		const types: { types: { [key: string]: ObsidianParamTypes } } =
			JSON.parse(file);
		fieldTypes.forEach((type, name) => (types["types"][name] = type));
		const json = JSON.stringify(types);
		fs.writeFileSync(filePath, json, "utf-8");
	}
};

export const mapContentfulTypesToObsidian = (
	type: (typeof allowedFieldTypes)[number]
): ObsidianParamTypes => {
	switch (type) {
		case "Array":
			return "multitext";
		case "Boolean":
			return "checkbox";
		case "Date":
			return "datetime";
		case "Integer":
		case "Number":
			return "number";
		case "Text":
		case "Symbol":
			return "text";
		default:
			return "text";
	}
};

import { FileSystemAdapter, Vault } from "obsidian";
import * as fs from "fs";
import * as path from "path";

export const getTemplatesFolderName = (vault: Vault) => {
	const configDir = vault.configDir;
	const adapter = vault.adapter;
	const basePath =
		adapter instanceof FileSystemAdapter && adapter.getBasePath();

	if (basePath) {
		const filePath = path.join(basePath, configDir, "templates.json");
		const templateJsonFile = fs.readFileSync(filePath, "utf-8");
		const templateJsonObj: { folder: string } =
			JSON.parse(templateJsonFile);
		return templateJsonObj.folder;
	}
};

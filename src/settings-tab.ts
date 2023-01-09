import { App, PluginSettingTab, Setting } from "obsidian";
import type SuperPlan from "./main";

export class SuperPlanSettingsTab extends PluginSettingTab {
	private readonly plugin: SuperPlan;

	constructor(app: App, plugin: SuperPlan) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display() {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Plan Folder")
			.addSearch((cb) => {
				cb.setPlaceholder("Folder")
					.setValue(this.plugin.settings.planFolder)
					.onChange((value: string) => {
						this.plugin.settings.planFolder = value;
						this.plugin.saveData(this.plugin.settings);
					});
			})
			.setDesc("Folder where auto-created notes will be saved");
	}
}

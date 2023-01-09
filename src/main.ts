import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	Setting,
} from "obsidian";
import { PlanFile } from "./plan-file";
import { Parser } from "./parser";
import { PlanEditor } from "./plan-editor";
import { SuperPlanSettings } from "./settings";
import { PlanManager } from "./plan-manager";
import { SuperPlanSettingsTab } from "./settings-tab";
import { PlanTracker } from "./plan-tracker";
import { timer } from "./timer";

// Remember to rename these classes and interfaces!

export default class SuperPlan extends Plugin {
	settings: SuperPlanSettings;

	private file: PlanFile;
	private parser: Parser;
	private cmEditors: CodeMirror.Editor[];
	private tracker: PlanTracker;

	async onload() {
		await this.loadSettings();

		this.parser = new Parser(this.settings);
		this.file = new PlanFile(this.app.vault, this.parser, this.settings);

		this.tracker = new PlanTracker(
			this.parser,
			this.file,
			this.addStatusBarItem()
		);
		this.tracker.init();

		new PlanManager(this);

		this.cmEditors = [];
		this.registerCodeMirror((cm) => {
			this.cmEditors.push(cm);
			cm.on("keydown", this.handleKeyDown);
		});

		this.addCommand({
			id: "insert-plan-table",
			name: "Insert plan table",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.newPerformTableAction((pe) => {
					pe.insertPlanTable();
				})(false, editor, view);
			},
		});

		this.addCommand({
			id: "insert-activity",
			name: "Insert activity",
			editorCheckCallback: this.newPerformTableAction((pe) => {
				pe.insertActivity();
			}),
		});

		this.addCommand({
			id: "start-activity",
			name: "Start activity",
			editorCheckCallback: this.newPerformTableAction((pe) => {
				pe.startCursorActivity();
			}),
		});

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		this.addSettingTab(new SuperPlanSettingsTab(this.app, this));

		this.registerInterval(timer.intervalId);

		timer.onTick(this.onTick.bind(this));
	}

	async onTick() {
		const content = await this.file.getTodayPlanFileContent();
		const planTable = this.parser.findPlanTable(content);
		if (planTable) {
			const activitiesData = this.parser.transformTable(planTable);

			this.tracker.setData(activitiesData, planTable);
		}
	}

	onunload() {
		this.cmEditors.forEach((cm) => {
			cm.off("keydown", this.handleKeyDown);
		});
		timer.removeListener();
	}

	private readonly handleKeyDown = (
		cm: CodeMirror.Editor,
		event: KeyboardEvent
	): void => {
		console.log(event.key);
		if (["Tab", "Enter"].contains(event.key)) {
		}
	};

	readonly newPerformPlanActionCM6 =
		(fn: (pe: PlanEditor) => void): (() => boolean) =>
		(): boolean => {
			const leaf = this.app.workspace.activeLeaf!;
			if (leaf.view instanceof MarkdownView) {
				const pe = new PlanEditor(
					this.app,
					leaf.view.file,
					leaf.view.editor,
					this.parser,
					this.settings
				);

				if (pe.cursorIsInPlan()) {
					fn(pe);
					return true;
				}
			}
			return false;
		};

	private readonly newPerformTableAction =
		(fn: (pe: PlanEditor) => void, alertOnNoTable = true) =>
		(
			checking: boolean,
			editor: Editor,
			view: MarkdownView
		): boolean | void => {
			const pe = new PlanEditor(
				this.app,
				view.file,
				editor,
				this.parser,
				this.settings
			);

			if (checking) {
				return pe.cursorIsInPlan();
			}

			fn(pe);
		};

	async loadSettings() {
		const settingsOptions = Object.assign({}, await this.loadData());
		this.settings = new SuperPlanSettings(settingsOptions);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

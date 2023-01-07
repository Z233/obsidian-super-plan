import { Extension, Prec } from "@codemirror/state";
import { EditorView, KeyBinding, keymap } from "@codemirror/view";
import { Focus } from "@tgrosinger/md-advanced-tables";
import SuperPlan from "./main";
import { PlanEditor } from "./plan-editor";
import { PlanCell, Maybe, PlanCellType } from "./types";
import { isEqual, debounce } from "lodash-es";

export class PlanManager {
	private readonly plugin: SuperPlan;
	private lastFocus: Maybe<Focus>;
	private lastActiveCell: Maybe<PlanCell>;
	private activeCell: Maybe<PlanCell>;

	constructor(plugin: SuperPlan) {
		this.plugin = plugin;

		this.plugin.registerEditorExtension(
			this.makeEditorRemappingExtension()
		);
		this.plugin.registerEditorExtension(
			this.makeEditorUpdateListenerExtension()
		);
	}

	private readonly makeEditorUpdateListenerExtension = (): Extension => {
		return EditorView.updateListener.of((v) => {
			if ((!v.selectionSet && !v.focusChanged) || v.docChanged) return;
			const fn = debounce(
				this.plugin.newPerformPlanActionCM6((pe) => {
					const newCell = pe.getCursorCell();
					if (!isEqual(this.activeCell, newCell)) {
						this.lastActiveCell = this.activeCell;
						this.activeCell = newCell;
						pe.onFocusCellChanged(this.lastActiveCell);
					}
				})
			);
			fn();
		});
	};

	private readonly makeEditorRemappingExtension = (): Extension => {
		const keymaps: KeyBinding[] = [];
		const shouldNextRow = (cellType: PlanCellType) => {
			const arr: PlanCellType[] = ["actLen", "r"];
			return arr.contains(cellType);
		};

		keymaps.push({
			key: "Enter",
			run: (): boolean =>
				this.plugin.newPerformPlanActionCM6((pe) => {
					const focusedCell = pe.getCursorCell();
					if (!focusedCell) return;

					if (shouldNextRow(focusedCell.type)) {
						pe.insertActivity();
					} else {
						pe.nextCell();
					}
				})(),
			preventDefault: true,
		});

		keymaps.push({
			key: "Tab",
			run: (): boolean =>
				this.plugin.newPerformPlanActionCM6((pe: PlanEditor) => {
					pe.nextCell();
				})(),
			shift: (): boolean =>
				this.plugin.newPerformPlanActionCM6((pe: PlanEditor) =>
					pe.previousCell()
				)(),
			preventDefault: true,
		});

		keymaps.push({
			key: "Ctrl-Delete",
			run: () =>
				this.plugin.newPerformPlanActionCM6((pe: PlanEditor) =>
					pe.deleteRow()
				)(),
			preventDefault: true,
		});

		return Prec.override(keymap.of(keymaps));
	};
}

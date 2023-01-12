import { ButtonComponent, type TooltipOptions } from "obsidian";

export function tooltipAction(el: HTMLElement, leftMins: number) {
	const tooltipOptions: TooltipOptions = {
		placement: "top",
	};

	const tooltipButtonComp = new ButtonComponent(el);
	const setTooltipText = (leftMins: number) => {
		let content = "";
		if (leftMins > 0) {
			content = `Left: ${leftMins} mins`;
		} else if (leftMins === 0) {
			content = "Done";
		} else if (leftMins < 0) {
			content = `Done ${-leftMins} mins ago`;
		}
		tooltipButtonComp.setTooltip(content, tooltipOptions);
	};
	setTooltipText(leftMins);

	return {
		update(leftMins: number) {
			setTooltipText(leftMins);
		},
	};
}

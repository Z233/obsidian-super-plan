# Obsidian Super Plan

![GitHub release (latest by date)](https://img.shields.io/github/v/release/z233/obsidian-super-plan?style=plastic)
![GitHub all releases](https://img.shields.io/github/downloads/z233/obsidian-super-plan/total?style=plastic)

> ⚠ This plugin is in its early stages and is still under development.

An Obsidian plugin that helps you plan your day with full productivity.

The plugin is based on [SuperMemo Plan](https://supermemo.guru/wiki/Plan). If you are unfamiliar
with it, you can get started by exploring the following resources:

- [Plan in SuperMemo](https://help.supermemo.org/wiki/Plan)
- [Planning a perfect productive day without stress](https://supermemo.guru/wiki/Planning_a_perfect_productive_day_without_stress)

## Limitations

The algorithm used for scheduling may differ from the original SuperMemo Plan and is still
undergoing improvement.

## Installation

To install the plugin, simply download the latest zip file from the
[Github Releases page](https://github.com/Z233/obsidian-super-plan/releases/latest), and extract the
contents to the plugins folder in your Obsidian vault.

## How to Use

After installation, navigate to the plugin's settings to set up the plan folder and file format. In
the editor, use the `Insert new plan` command to add a new plan table. (Note: A plan must contain at
least two activities. The first and last activities are fixed; they represent the beginning and end
of a plan, respectively.)

In the plan table, click any cell to edit. You should't manually editing the `ActLen` cell, as its
value is automatically calculated. Right-clicking on any cell will display a context menu. If you
encounter errors such as `##NUM!` in a cell, it likely indicates an invalid input.

While editing the plan table:

| Hotkey      | Action                                                    |
| ----------- | --------------------------------------------------------- |
| Tab         | Navigate to the next cell                                 |
| Shift + Tab | Navigate to the previous cell                             |
| Enter       | Move to the next cell and insert a new activity if needed |
| Alt + B     | Begin or unfixed activity under cursor                    |

More hotkeys are WIP...

## Features

### Plan Tracker

The plugin detects daily plans based on the folder and file format specified in the settings. If
there's an ongoing activity, its information will be displayed in the status bar.

### Activity Name Auto-Completion

This feature utilizes a modified version of obsidian-dataview. To enable this feature, you must
install this modified version first, which is available for download in
[the plugin's release files](https://github.com/Z233/obsidian-super-plan/releases/latest).

### Mini-Tracker Window

This feature opens an independent window outside of Obsidian to track the progress of the ongoing
activity. This window stays on top of other windows, allowing you to drag and position it as
desired.

## WIP...

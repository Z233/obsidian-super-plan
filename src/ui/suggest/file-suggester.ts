// Credits go to Liam's Periodic Notes Plugin: https://github.com/liamcain/obsidian-periodic-notes

import type { App, TAbstractFile } from 'obsidian'
import { TFile, TFolder } from 'obsidian'
import type DayPlanner from '../../main'
import { errorWrapperSync } from '../../util/error'
import { get_tfiles_from_folder } from '../../util/helper'
import { TextInputSuggest } from './file-suggest'

export enum FileSuggestMode {
  TemplateFiles,
  ScriptFiles,
}

export class FileSuggest extends TextInputSuggest<TFile> {
  constructor(
    public app: App,
    public inputEl: HTMLInputElement,
    private plugin: DayPlanner,
    private mode: FileSuggestMode,
  ) {
    super(app, inputEl)
  }

  getSuggestions(input_str: string): TFile[] {
    const all_files = errorWrapperSync(
      () => get_tfiles_from_folder(this.app, app.vault.getRoot().path),
      'No files found',
    )
    if (!all_files)
      return []

    const files: TFile[] = []
    const lower_input_str = input_str.toLowerCase()

    all_files.forEach((file: TAbstractFile) => {
      if (
        file instanceof TFile
        && file.extension === 'md'
        && file.path.toLowerCase().contains(lower_input_str)
      )
        files.push(file)
    })

    return files
  }

  renderSuggestion(file: TFile, el: HTMLElement): void {
    el.setText(file.path)
  }

  selectSuggestion(file: TFile): void {
    this.inputEl.value = file.path
    this.inputEl.trigger('input')
    this.close()
  }
}

export class FolderSuggest extends TextInputSuggest<TFolder> {
  getSuggestions(inputStr: string): TFolder[] {
    const abstractFiles = this.app.vault.getAllLoadedFiles()
    const folders: TFolder[] = []
    const lowerCaseInputStr = inputStr.toLowerCase()

    abstractFiles.forEach((folder: TAbstractFile) => {
      if (folder instanceof TFolder && folder.path.toLowerCase().contains(lowerCaseInputStr))
        folders.push(folder)
    })

    return folders
  }

  renderSuggestion(file: TFolder, el: HTMLElement): void {
    el.setText(file.path)
  }

  selectSuggestion(file: TFolder): void {
    this.inputEl.value = file.path
    this.inputEl.trigger('input')
    this.close()
  }
}

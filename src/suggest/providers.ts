import { uniq } from 'lodash-es'
import { normalizePath } from 'obsidian'
import { getAPI, Result, Success } from 'obsidian-dataview'
import type { SuperPlanSettings } from 'src/settings'

const SUB_ACTIVITY_RE = /\s+\(#\d+\)$/g

export class ActivityProvider {
  activityNames: string[] = []

  constructor(private settings: SuperPlanSettings) {}

  async refresh() {
    const dv = getAPI()
    if (!dv) return

    const query = await dv.query(
      `LIST P.Activity FROM "${normalizePath(
        this.settings.dailyPlanNoteFolder
      )}" FLATTEN file.tables.plan AS P`
    )

    if (this.checkIsQuerySuccessful(query)) {
      let activities = query.value.values
        .map((x) => x.value && this.formatActivityName(x.value))
        .filter((x) => x)

      this.activityNames = uniq(activities)
    }
  }

  private formatActivityName(origin: string) {
    return origin.replaceAll(SUB_ACTIVITY_RE, '')
  }

  private checkIsQuerySuccessful(
    query: Result<unknown, unknown>
  ): query is Success<unknown, unknown> {
    return query.successful
  }
}

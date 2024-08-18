import { App, Component, MetadataCache, TFile } from "obsidian";
import { FileImporter } from "./web-worker/import-manager";
import type { PagePlanData } from "src/types";

export class PlanIndex extends Component {

    public metadataCache: MetadataCache
    private static instance: PlanIndex
  
    
    public importer: FileImporter
  
    private constructor(private app: App) {
      super()
      this.metadataCache = app.metadataCache
      this.addChild((this.importer = new FileImporter(2, app.vault)))
    }
  
    static new(app: App) {
      if (!this.instance) {
        this.instance = new PlanIndex(app)
      }
      return this.instance
   }
  
    private async import(file: TFile): Promise<void> {
        return this.importer.reload<PagePlanData>(file).then((result) => {
          console.log('🔴 -> result:', result);
        });
    }
    
    public initialize() {
          this.registerEvent(this.metadataCache.on("resolve", file => {
            this.import(file)
          }));
    }
}
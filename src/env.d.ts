/// <reference types="vite/client" />

declare const __DEV__: boolean
declare const __MINI_TRACKER_HTML__: string

declare module "web-worker:*" {
    const WorkerFactory: new (options: any) => Worker;
    export default WorkerFactory;
}

interface ImportMetaEnv {
  readonly VITE_DEV_SERVER_URL: string
}

import type { Url } from './common';

export interface HelmIndex {
   readonly apiVersion: HelmIndexApiVersion;
   readonly entries: Record<string, HelmIndexEntry[]>;
}

export enum HelmIndexApiVersion {
   v1 = 'v1',
}

export interface HelmIndexEntry extends HelmChart {
   readonly urls?: Url[] | undefined;
   readonly created?: string | undefined;
   readonly removed?: boolean | undefined;
   readonly digest?: string | undefined;

   // The following fields are deprecated, but still known...
   readonly checksum?: string | undefined;
   readonly engine?: string | undefined;
   readonly tillerVersion?: string | undefined;
   readonly url?: string | undefined;
}

export interface HelmIndexEntryHolder {
   readonly entry?: HelmIndexEntry | undefined;
}

export interface HelmChart {
   readonly name: string;
   readonly home?: string | undefined;
   readonly sources?: Url[] | undefined;
   readonly version: string;
   readonly description?: string | undefined;
   readonly keywords?: string[] | undefined;
   readonly maintainers?: HelmChartMaintainer[] | undefined;
   readonly icon?: Url | undefined;
   readonly apiVersion: HelmChartApiVersion;
   readonly condition?: string | undefined;
   readonly tags?: string | undefined;
   readonly appVersion: string;
   readonly deprecated?: boolean | undefined;
   readonly annotations?: Record<string, string> | undefined;
   readonly kubeVersion?: string | undefined;
   readonly dependencies?: HelmChartDependency[] | undefined;
}

export enum HelmChartApiVersion {
   v1 = 'v1',
   v2 = 'v2',
}

export interface HelmChartMaintainer {
   readonly name?: string | undefined;
   readonly mail?: string | undefined;
   readonly url?: Url | undefined;
}

export interface HelmChartDependency {
   readonly name?: string | undefined;
   readonly version?: string | undefined;
   readonly repository?: string | undefined;
   readonly condition?: string | undefined;
   readonly tags?: string[] | undefined;
   readonly enabled?: boolean | undefined;
   readonly alias?: string | undefined;
}

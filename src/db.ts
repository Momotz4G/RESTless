import Dexie, { type EntityTable } from 'dexie';

export type AuthType = 'none' | 'bearer' | 'basic' | 'apiKey' | 'oauth2' | 'aws' | 'digest';

export interface AuthConfig {
  type: AuthType;
  bearerToken: string;
  basicUsername: string;
  basicPassword: string;
  apiKeyKey: string;
  apiKeyValue: string;
  apiKeyAddTo: 'header' | 'queryParams';
  oauth2Token: string;
  awsAccessKey: string;
  awsSecretKey: string;
  awsRegion: string;
  awsService: string;
  digestUsername: string;
  digestPassword: string;
}

export interface SavedRequest {
  id?: number;
  name: string;
  method: string;
  url: string;
  queryParams: { key: string; value: string; active: boolean }[];
  headers: { key: string; value: string; active: boolean }[];
  body: string;
  auth?: AuthConfig;
  collectionId?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Collection {
  id?: number;
  name: string;
  createdAt: number;
}

export interface HistoryEntry {
  id?: number;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  queryParams: { key: string; value: string; active: boolean }[];
  headers: { key: string; value: string; active: boolean }[];
  body: string;
  auth?: AuthConfig;
  responseBody: string;
  responseHeaders: Record<string, string>;
  timestamp: number;
}

class RestlessDB extends Dexie {
  requests!: EntityTable<SavedRequest, 'id'>;
  collections!: EntityTable<Collection, 'id'>;
  history!: EntityTable<HistoryEntry, 'id'>;

  constructor() {
    super('RestlessDB');
    this.version(1).stores({
      requests: '++id, name, method, collectionId, createdAt, updatedAt',
      collections: '++id, name, createdAt',
      history: '++id, method, url, timestamp',
    });
  }
}

export const db = new RestlessDB();

# Site / Location / Asset Management API Contract

이 문서는 프론트엔드에서 구현한 공정, 위치, 설비 관리 API 함수의 요청/응답 형태를 백엔드 협업용으로 정리한 문서입니다.

## Base URL

프론트 서버 API 프록시와 백엔드 원 API 경로는 동일한 path를 사용합니다.

- Front proxy: `/api/v1/...`
- Backend origin: `{CHECKLAB_API_BASE_URL}/api/v1/...`

프론트는 브라우저에서 직접 백엔드를 치지 않고 Next route handler를 거쳐 호출합니다. 백엔드 주소는 `CHECKLAB_API_BASE_URL` 또는 `NEXT_PUBLIC_CHECKLAB_API_BASE_URL` 환경변수를 사용합니다.

## Common Rules

- Request body는 JSON입니다.
- JSON 요청에는 `content-type: application/json`, `accept: application/json`을 보냅니다.
- 성공 응답은 JSON 객체 또는 빈 응답을 허용합니다.
- 빈 성공 응답 또는 `204 No Content`도 프론트에서는 성공으로 처리합니다.
- 실패 시 백엔드가 `{ "message": "..." }`를 내려주면 프론트 화면에 해당 메시지를 표시할 수 있습니다.
- 프론트는 성공 응답에 ID가 있으면 그 값을 우선 사용하고, 없으면 요청 때 보낸 local draft 값을 fallback으로 사용합니다.

## API Function Summary

| Front function | Method | Endpoint | Purpose |
| --- | --- | --- | --- |
| `createSite(payload)` | `POST` | `/api/v1/site` | 공정 생성. location/assets 중첩 생성 가능 |
| `updateSite(site_id, payload)` | `PUT` | `/api/v1/site/{site_id}` | 공정 수정 |
| `deleteSite(site_id)` | `DELETE` | `/api/v1/site/{site_id}` | 공정 삭제 |
| `createLocation(payload)` | `POST` | `/api/v1/location` | 위치 생성 |
| `updateLocation(location_id, payload)` | `PUT` | `/api/v1/location/{location_id}` | 위치 수정 |
| `deleteLocation(location_id)` | `DELETE` | `/api/v1/location/{location_id}` | 위치 삭제 |
| `createAsset(payload)` | `POST` | `/api/v1/asset` | 설비 생성 |
| `updateAsset(asset_id, payload)` | `PUT` | `/api/v1/asset/{asset_id}` | 설비 수정 |
| `deleteAsset(asset_id)` | `DELETE` | `/api/v1/asset/{asset_id}` | 설비 삭제 |
| `fetchMonitoringTree()` | `GET` | `/api/v1/monitoring-tree` | 사이드 메뉴와 공정/위치/설비 상세 페이지용 트리 조회 |

## 1. Site Create

### Endpoint

```http
POST /api/v1/site
```

### Request Type

```ts
type ApiCreateSiteRequest = {
  process_name: string;
  description?: string;
  locations?: Array<{
    name: string;
    description?: string;
    floor?: string;
    assets?: Array<{
      name: string;
      description?: string;
    }>;
  }>;
};
```

### Request Example: site only

```json
{
  "process_name": "Compression Process",
  "description": "Main compression line"
}
```

### Request Example: site + locations + assets

```json
{
  "process_name": "Compression Process",
  "description": "Main compression line",
  "locations": [
    {
      "name": "Machine Room",
      "description": "Primary room",
      "floor": "1F",
      "assets": [
        {
          "name": "Compressor 01",
          "description": "Main unit"
        }
      ]
    }
  ]
}
```

### Recommended Success Response

```json
{
  "site_id": "compression-process",
  "process_name": "Compression Process",
  "description": "Main compression line",
  "locations": [
    {
      "location_id": "machine-room",
      "name": "Machine Room",
      "description": "Primary room",
      "floor": "1F",
      "assets": [
        {
          "asset_id": "compressor-01",
          "name": "Compressor 01",
          "description": "Main unit"
        }
      ]
    }
  ]
}
```

### Frontend Response Mapping

- Site ID: `site_id` -> `process_id` -> `id` -> local fallback
- Site name: `process_name` -> `name` -> local fallback
- Description: `description` -> `summary` -> local fallback
- Nested location IDs: `location_id` -> `id` -> local fallback
- Nested asset IDs: `asset_id` -> `id` -> local fallback

## 2. Site Update

### Endpoint

```http
PUT /api/v1/site/{site_id}
```

### Path Params

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `site_id` | string | yes | 수정할 공정 ID |

### Request Type

```ts
type ApiUpdateSiteRequest = {
  process_name: string;
  description?: string;
};
```

### Request Example

```json
{
  "process_name": "Compression Process",
  "description": "Updated compression line"
}
```

### Recommended Success Response

```json
{
  "site_id": "compression-process",
  "process_name": "Compression Process",
  "description": "Updated compression line"
}
```

## 3. Site Delete

### Endpoint

```http
DELETE /api/v1/site/{site_id}
```

### Path Params

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `site_id` | string | yes | 삭제할 공정 ID |

### Request Body

없음.

### Success Response

권장:

```json
{
  "deleted": true,
  "site_id": "compression-process"
}
```

빈 응답 또는 `204 No Content`도 허용됩니다.

## 4. Location Create

### Endpoint

```http
POST /api/v1/location
```

### Request Type

```ts
type ApiCreateLocationRequest = {
  site_id: string;
  name: string;
  description?: string;
  floor?: string;
};
```

### Request Example

```json
{
  "site_id": "compression-process",
  "name": "Machine Room",
  "description": "Primary room",
  "floor": "1F"
}
```

### Recommended Success Response

```json
{
  "location_id": "machine-room",
  "site_id": "compression-process",
  "name": "Machine Room",
  "description": "Primary room",
  "floor": "1F"
}
```

### Frontend Response Mapping

- Location ID: `location_id` -> `id` -> local fallback
- Location name: `name` -> local fallback
- Description: `description` -> `summary` -> local fallback
- Floor: `floor` -> local fallback
- Status, if provided: `status` or `dashboard_status`

## 5. Location Update

### Endpoint

```http
PUT /api/v1/location/{location_id}
```

### Path Params

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `location_id` | string | yes | 수정할 위치 ID |

### Request Type

```ts
type ApiUpdateLocationRequest = {
  name: string;
  description?: string;
  floor?: string;
};
```

### Request Example

```json
{
  "name": "Machine Room",
  "description": "Updated primary room",
  "floor": "2F"
}
```

### Recommended Success Response

```json
{
  "location_id": "machine-room",
  "name": "Machine Room",
  "description": "Updated primary room",
  "floor": "2F"
}
```

## 6. Location Delete

### Endpoint

```http
DELETE /api/v1/location/{location_id}
```

### Path Params

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `location_id` | string | yes | 삭제할 위치 ID |

### Request Body

없음.

### Success Response

권장:

```json
{
  "deleted": true,
  "location_id": "machine-room"
}
```

빈 응답 또는 `204 No Content`도 허용됩니다.

## 7. Asset Create

### Endpoint

```http
POST /api/v1/asset
```

### Request Type

```ts
type ApiCreateAssetRequest = {
  location_id: string;
  name: string;
  description?: string;
};
```

### Request Example

```json
{
  "location_id": "machine-room",
  "name": "Compressor 01",
  "description": "Main unit"
}
```

### Recommended Success Response

```json
{
  "asset_id": "compressor-01",
  "location_id": "machine-room",
  "name": "Compressor 01",
  "description": "Main unit"
}
```

### Frontend Response Mapping

- Asset ID: `asset_id` -> `id` -> local fallback
- Asset name: `name` -> local fallback
- Description: `description` -> `summary` -> local fallback
- Optional asset code: `asset_code` or `assetCode`
- Optional manager: `manager` or `manager_name`
- Optional type: `type` or `asset_type`
- Status, if provided: `status` or `dashboard_status`

## 8. Asset Update

### Endpoint

```http
PUT /api/v1/asset/{asset_id}
```

### Path Params

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `asset_id` | string | yes | 수정할 설비 ID |

### Request Type

```ts
type ApiUpdateAssetRequest = {
  name: string;
  description?: string;
};
```

### Request Example

```json
{
  "name": "Compressor 01",
  "description": "Updated main unit"
}
```

### Recommended Success Response

```json
{
  "asset_id": "compressor-01",
  "name": "Compressor 01",
  "description": "Updated main unit"
}
```

## 9. Asset Delete

### Endpoint

```http
DELETE /api/v1/asset/{asset_id}
```

### Path Params

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `asset_id` | string | yes | 삭제할 설비 ID |

### Request Body

없음.

### Success Response

권장:

```json
{
  "deleted": true,
  "asset_id": "compressor-01"
}
```

빈 응답 또는 `204 No Content`도 허용됩니다.

## 10. Monitoring Tree Read

사이드 메뉴 `MonitoringTreeSection`과 `/site/{site_id}/location/{location_id}/asset/{asset_id}` 페이지는 샘플 데이터 없이 이 응답만 기준으로 화면 값을 구성합니다.

### Endpoint

```http
GET /api/v1/monitoring-tree
```

### Recommended Success Response

```json
{
  "id": "overview",
  "label": "전체 현황",
  "children": [
    {
      "site_id": "compression-process",
      "process_name": "Compression Process",
      "description": "Main compression line",
      "locations": [
        {
          "location_id": "machine-room",
          "name": "Machine Room",
          "description": "Primary room",
          "floor": "1F",
          "assets": [
            {
              "asset_id": "compressor-01",
              "name": "Compressor 01",
              "description": "Main unit",
              "status": "normal"
            }
          ]
        }
      ]
    }
  ]
}
```

### Frontend Response Mapping

- Site ID: `site_id` -> `process_id` -> `id`
- Site name: `process_name` -> `name` -> `label`
- Location ID: `location_id` -> `id`
- Asset ID: `asset_id` -> `id`
- Status: `status` -> `dashboard_status` -> `overall_status`
- 프론트가 만드는 href:
  - site: `/site/{site_id}`
  - location: `/site/{site_id}/location/{location_id}`
  - asset: `/site/{site_id}/location/{location_id}/asset/{asset_id}`

## Error Response Recommendation

백엔드는 실패 시 다음 형태를 권장합니다.

```json
{
  "message": "A readable error message for the frontend.",
  "code": "SITE_DUPLICATED"
}
```

프론트는 현재 `message`만 화면에 표시합니다. `code`는 추후 에러 분기용으로 사용할 수 있습니다.

## Current Frontend Source Files

- Server-side API functions: `src/app/site/services/site-management-api.ts`
- Browser proxy functions: `src/app/site/services/site-management-client.ts`
- Next proxy routes: `src/app/api/v1/...`
- UI integration: `src/app/site/components/site-index-page.tsx`
- Monitoring tree adapter: `src/app/monitoring/services/monitoring-tree-api.ts`

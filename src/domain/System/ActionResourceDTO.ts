// DTOs for request and response
export interface LocalizationKeyActionDTO {
  keyId: number
  action: string
  fromEnum: string // Changed to string since from_enum is TEXT type
  styleResourceId: number
  effectResourceId: number
}

export interface LocalizationKeyActionBulkDTO {
  actions: LocalizationKeyActionDTO[]
}

import { StatusByCode, StatusByString } from './identifier'
// code : a,b,c,d
// name : default, first, second, third
export { StatusByCode as IdentifiersCode, StatusByString as IdentifiersName }

export const actionTypes = [
  'default',
  'hover',
  'active',
  'disabled',
  'loading',
  'error',
  'visited',
  'readonly',
] as const

/**
 * action : select 는 동의어
 */
export type ActionType = (typeof actionTypes)[number]

import type { ResourceDefinition } from '../resource.types.js';
import { businessResources, financeResources } from './business.js';
import { commerceResources } from './commerce.js';
import {
  entertainmentResources,
  foodResources,
  travelResources,
} from './lifestyle.js';
import {
  educationResources,
  healthResources,
  miscResources,
  techResources,
} from './misc.js';
import { socialResources } from './social.js';

export const RESOURCE_DEFINITIONS: ResourceDefinition[] = [
  ...socialResources,
  ...commerceResources,
  ...businessResources,
  ...financeResources,
  ...entertainmentResources,
  ...foodResources,
  ...travelResources,
  ...educationResources,
  ...healthResources,
  ...techResources,
  ...miscResources,
];

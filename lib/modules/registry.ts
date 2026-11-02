/**
 * TravNeeds Modular Platform — Central Module Registry & Dependency Engine
 *
 * Implements registration, dependency validation (missing & circular graph checks),
 * and entitlement resolution without database or runtime dependencies.
 */

import type { ModuleManifest } from './types';

export interface DependencyResolutionResult {
  valid: boolean;
  missingDependencies: Record<string, string[]>;
  circularDependencies: string[][];
  unmetOptionalDependencies: Record<string, string[]>;
}

export class ModuleRegistryError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'ModuleRegistryError';
  }
}

export class ModuleRegistry {
  private readonly modules = new Map<string, ModuleManifest>();

  /**
   * Registers a new module manifest.
   * Enforces uniqueness and structural validity.
   */
  public register(manifest: ModuleManifest): void {
    if (!manifest || typeof manifest !== 'object') {
      throw new ModuleRegistryError('Invalid manifest: Must be a non-null object', 'INVALID_MANIFEST');
    }

    if (!manifest.id || typeof manifest.id !== 'string' || manifest.id.trim() === '') {
      throw new ModuleRegistryError('Invalid manifest: ID must be a non-empty string', 'INVALID_MODULE_ID');
    }

    const normalizedId = manifest.id.trim().toLowerCase();

    if (this.modules.has(normalizedId)) {
      throw new ModuleRegistryError(`Duplicate module ID: '${normalizedId}' is already registered`, 'DUPLICATE_MODULE_ID');
    }

    if (!manifest.displayName?.en || !manifest.displayName?.ar) {
      throw new ModuleRegistryError(
        `Invalid manifest '${normalizedId}': Must provide at least English (en) and Arabic (ar) display names`,
        'MISSING_REQUIRED_LOCALIZATION'
      );
    }

    this.modules.set(normalizedId, manifest);
  }

  /**
   * Returns a module manifest by its ID.
   */
  public get(id: string): ModuleManifest | undefined {
    return this.modules.get(id.trim().toLowerCase());
  }

  /**
   * Returns all registered modules.
   */
  public getAll(): ModuleManifest[] {
    return Array.from(this.modules.values());
  }

  /**
   * Returns all modules ready for customer subscription / licensing.
   */
  public getSubscriptionReady(): ModuleManifest[] {
    return this.getAll().filter((m) => m.lifecycle === 'available_for_subscription');
  }

  /**
   * Returns all core platform modules.
   */
  public getCoreModules(): ModuleManifest[] {
    return this.getAll().filter((m) => m.isCore);
  }

  /**
   * Resolves and verifies dependencies for a given set of requested or active module IDs.
   */
  public validateDependencies(enabledModuleIds: Iterable<string>): DependencyResolutionResult {
    const enabledSet = new Set(Array.from(enabledModuleIds).map((id) => id.trim().toLowerCase()));

    // Always include core modules as implicitly present
    for (const coreMod of this.getCoreModules()) {
      enabledSet.add(coreMod.id);
    }

    const missingDependencies: Record<string, string[]> = {};
    const unmetOptionalDependencies: Record<string, string[]> = {};

    for (const id of enabledSet) {
      const manifest = this.get(id);
      if (!manifest) {
        missingDependencies[id] = [`Unknown module: '${id}'`];
        continue;
      }

      for (const requiredDep of manifest.requiredDependencies) {
        const normDep = requiredDep.trim().toLowerCase();
        if (!enabledSet.has(normDep)) {
          if (!missingDependencies[id]) missingDependencies[id] = [];
          missingDependencies[id].push(normDep);
        }
      }

      for (const optDep of manifest.optionalDependencies) {
        const normOpt = optDep.trim().toLowerCase();
        if (!enabledSet.has(normOpt)) {
          if (!unmetOptionalDependencies[id]) unmetOptionalDependencies[id] = [];
          unmetOptionalDependencies[id].push(normOpt);
        }
      }
    }

    // Circular Dependency Detection (Tarjan / DFS cycle detection)
    const circularDependencies = this.findCircularDependencies(enabledSet);

    const hasMissing = Object.keys(missingDependencies).length > 0;
    const hasCycles = circularDependencies.length > 0;

    return {
      valid: !hasMissing && !hasCycles,
      missingDependencies,
      circularDependencies,
      unmetOptionalDependencies,
    };
  }

  /**
   * Detects circular dependency chains among enabled modules.
   */
  private findCircularDependencies(enabledSet: Set<string>): string[][] {
    const visited = new Set<string>();
    const recStack = new Set<string>();
    const path: string[] = [];
    const cycles: string[][] = [];

    const dfs = (curr: string) => {
      visited.add(curr);
      recStack.add(curr);
      path.push(curr);

      const manifest = this.get(curr);
      if (manifest) {
        for (const dep of manifest.requiredDependencies) {
          const normDep = dep.trim().toLowerCase();
          if (!enabledSet.has(normDep)) continue;

          if (!visited.has(normDep)) {
            dfs(normDep);
          } else if (recStack.has(normDep)) {
            const cycleStart = path.indexOf(normDep);
            if (cycleStart !== -1) {
              cycles.push([...path.slice(cycleStart), normDep]);
            }
          }
        }
      }

      path.pop();
      recStack.delete(curr);
    };

    for (const id of enabledSet) {
      if (!visited.has(id)) {
        dfs(id);
      }
    }

    return cycles;
  }
}

/**
 * Global singleton module registry instance.
 */
export const platformModuleRegistry = new ModuleRegistry();

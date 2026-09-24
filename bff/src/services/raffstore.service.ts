/**
 * RaffstoreService - Business logic for raffstore commands
 */

import { RaffstoreDatapoints, Raffstore, Favorite, Event, GatewayCommand } from '../models';
import { GatewayService } from './gateway.service';

interface StepMapping {
  [key: number]: number;
}

/**
 * Kind of status feedback received from the KNX backend for a raffstore.
 */
export type StatusKind = 'position' | 'lamella' | 'endTop' | 'endBottom';

const STEP_TO_KNX = {
  height: { 0: 0, 1: 33, 2: 66, 3: 100 } as StepMapping,
  angle: { 0: 0, 1: 50, 2: 100 } as StepMapping
};

const HEIGHT_STEP_UP = 0;
const HEIGHT_STEP_DOWN = 3;

export class RaffstoreService {
  private raffstoreConfig: Map<string, RaffstoreDatapoints> = new Map();
  private raffstores: Map<string, Raffstore> = new Map();
  private events: Event[] = [];
  private eventListeners: Array<(event: Event) => void> = [];

  constructor(private gatewayService: GatewayService, configData: RaffstoreDatapoints[]) {
    this.initializeConfig(configData);
    this.initializeRaffstores();
  }

  /**
   * Initialize configuration from data
   */
  private initializeConfig(configData: RaffstoreDatapoints[]): void {
    for (const cfg of configData) {
      this.raffstoreConfig.set(cfg.id, cfg);
    }
    console.log(`[RaffstoreService] Initialized with ${this.raffstoreConfig.size} raffstores`);
  }

  /**
   * Initialize raffstore objects
   */
  private initializeRaffstores(): void {
    for (const cfg of this.raffstoreConfig.values()) {
      this.raffstores.set(cfg.id, {
        id: cfg.id,
        name: cfg.name,
        floor: cfg.floor,
        orientation: cfg.orientation,
        heightStep: 1,
        angleStep: 0,
        autoMode: false,
        isMoving: false,
        lastUpdate: new Date().toISOString()
      });
    }
  }

  /**
   * Get all raffstores
   */
  getRaffstores(): Raffstore[] {
    return Array.from(this.raffstores.values());
  }

  /**
   * Get single raffstore
   */
  getRaffstore(id: string): Raffstore | undefined {
    return this.raffstores.get(id);
  }

  /**
   * Get config for raffstore
   */
  private getConfig(id: string): RaffstoreDatapoints {
    const cfg = this.raffstoreConfig.get(id);
    if (!cfg) {
      throw new Error(`Raffstore config not found: ${id}`);
    }
    return cfg;
  }

  /**
   * Create GatewayCommand for setting height
   */
  private createHeightCommand(raffstoreId: string, heightStep: number): GatewayCommand {
    const config = this.getConfig(raffstoreId);
    const knxValue = STEP_TO_KNX.height[heightStep] ?? 0;
    const datapointId = this.gatewayService.getDatapointId(config.gaPositionSet);

    return {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: knxValue.toString() }
      }]
    };
  }

  /**
   * Create GatewayCommand for setting angle
   */
  private createAngleCommand(raffstoreId: string, angleStep: number): GatewayCommand {
    const config = this.getConfig(raffstoreId);
    const knxValue = STEP_TO_KNX.angle[angleStep] ?? 0;
    const datapointId = this.gatewayService.getDatapointId(config.gaLamellasSet);

    return {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: knxValue.toString() }
      }]
    };
  }

  /**
   * Create GatewayCommand for moving up
   */
  private createMoveUpCommand(raffstoreId: string): GatewayCommand {
    const config = this.getConfig(raffstoreId);
    const datapointId = this.gatewayService.getDatapointId(config.gaMove);

    return {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: '0' } // DPT 1.008: 0 = Up
      }]
    };
  }

  /**
   * Create GatewayCommand for moving down
   */
  private createMoveDownCommand(raffstoreId: string): GatewayCommand {
    const config = this.getConfig(raffstoreId);
    const datapointId = this.gatewayService.getDatapointId(config.gaMove);

    return {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: '1' } // DPT 1.008: 1 = Down
      }]
    };
  }

  /**
   * Create GatewayCommand for stop
   */
  private createStopCommand(raffstoreId: string): GatewayCommand {
    const config = this.getConfig(raffstoreId);
    const datapointId = this.gatewayService.getDatapointId(config.gaStep);

    return {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: '1' } // DPT 1.007: 1 = Step
      }]
    };
  }

  /**
   * Execute command: moveUp
   */
  async moveUp(raffstoreId: string): Promise<void> {
    const command = this.createMoveUpCommand(raffstoreId);
    await this.gatewayService.sendCommand(command);
    this.updateRaffstore(raffstoreId, { heightStep: HEIGHT_STEP_UP, isMoving: true });
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'move', raffstoreId, direction: 'up', timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Execute command: moveDown
   */
  async moveDown(raffstoreId: string): Promise<void> {
    const command = this.createMoveDownCommand(raffstoreId);
    await this.gatewayService.sendCommand(command);
    this.updateRaffstore(raffstoreId, { heightStep: HEIGHT_STEP_DOWN, isMoving: true });
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'move', raffstoreId, direction: 'down', timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Execute command: stop
   */
  async stop(raffstoreId: string): Promise<void> {
    const command = this.createStopCommand(raffstoreId);
    await this.gatewayService.sendCommand(command);
    this.updateRaffstore(raffstoreId, { isMoving: false });
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'step', raffstoreId, timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Execute command: setHeight
   */
  async setHeight(raffstoreId: string, heightStep: number): Promise<void> {
    const command = this.createHeightCommand(raffstoreId, heightStep);
    await this.gatewayService.sendCommand(command);
    this.updateRaffstore(raffstoreId, { heightStep });
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'setHeight', raffstoreId, heightStep, timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Execute command: setAngle
   */
  async setAngle(raffstoreId: string, angleStep: number): Promise<void> {
    const command = this.createAngleCommand(raffstoreId, angleStep);
    await this.gatewayService.sendCommand(command);
    this.updateRaffstore(raffstoreId, { angleStep });
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'setAngle', raffstoreId, angleStep, timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Execute command: setPosition
   */
  async setPosition(raffstoreId: string, heightStep: number, angleStep: number): Promise<void> {
    const heightCommand = this.createHeightCommand(raffstoreId, heightStep);
    const angleCommand = this.createAngleCommand(raffstoreId, angleStep);

    const combinedCommand: GatewayCommand = {
      data: [...heightCommand.data, ...angleCommand.data]
    };

    await this.gatewayService.sendCommand(combinedCommand);
    this.updateRaffstore(raffstoreId, { heightStep, angleStep });
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'setPosition', raffstoreId, heightStep, angleStep, timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Create GatewayCommand for lock/auto mode (gaLock, DPT 1.001)
   */
  private createLockCommand(raffstoreId: string, locked: boolean): GatewayCommand {
    const config = this.getConfig(raffstoreId);
    const datapointId = this.gatewayService.getDatapointId(config.gaLock);

    return {
      data: [{
        type: 'datapoint',
        id: datapointId,
        attributes: { value: locked ? '1' : '0' } // DPT 1.001: 1 = locked (auto), 0 = released (manual)
      }]
    };
  }

  /**
   * Execute command: toggleAutoMode (write to gaLock)
   */
  async toggleAutoMode(raffstoreId: string): Promise<void> {
    const current = this.raffstores.get(raffstoreId);
    const newAutoMode = !current?.autoMode;

    const command = this.createLockCommand(raffstoreId, newAutoMode);
    await this.gatewayService.sendCommand(command);
    this.updateRaffstore(raffstoreId, { autoMode: newAutoMode });
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'toggleAutoMode', raffstoreId, timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Execute command: applyFavorite
   */
  async applyFavorite(raffstoreId: string, favorite: Favorite): Promise<void> {
    await this.setPosition(raffstoreId, favorite.heightStep, favorite.angleStep);
    this.emitEvent({
      type: 'command_executed',
      raffstoreId,
      command: { type: 'applyFavorite', raffstoreId, favorite, timestamp: Date.now() },
      timestamp: Date.now()
    });
  }

  /**
   * Execute command: groupCommand (all raffstores on a floor)
   */
  async groupCommand(floor: 'EG' | 'OG', direction: 'up' | 'down'): Promise<void> {
    const commands: GatewayCommand['data'] = [];

    for (const cfg of this.raffstoreConfig.values()) {
      if (cfg.floor === floor) {
        const gaMove = cfg.gaMove;
        const datapointId = this.gatewayService.getDatapointId(gaMove);
        const value = direction === 'up' ? '0' : '1';

        commands.push({
          type: 'datapoint',
          id: datapointId,
          attributes: { value }
        });

        // Update local state
        const heightStep = direction === 'up' ? HEIGHT_STEP_UP : HEIGHT_STEP_DOWN;
        this.updateRaffstore(cfg.id, { heightStep, isMoving: false });
      }
    }

    if (commands.length > 0) {
      await this.gatewayService.sendCommand({ data: commands });
      this.emitEvent({
        type: 'command_executed',
        command: { type: 'groupCommand', floor, direction, timestamp: Date.now() },
        timestamp: Date.now()
      });
    }
  }

  /**
   * Apply a status feedback update received from the KNX backend.
   * Updates the raffstore's actual-value fields and emits a `status_changed` event.
   */
  applyStatusUpdate(raffstoreId: string, kind: StatusKind, rawValue: string | number | boolean): void {
    const current = this.raffstores.get(raffstoreId);
    if (!current) {
      console.warn(`[RaffstoreService] Status update for unknown raffstore: ${raffstoreId}`);
      return;
    }

    const updates: Partial<Raffstore> = {};

    switch (kind) {
      case 'position': {
        const percent = this.parsePercent(rawValue);
        if (percent === null) {
          return;
        }
        updates.statusPositionPercent = percent;
        break;
      }
      case 'lamella': {
        const percent = this.parsePercent(rawValue);
        if (percent === null) {
          return;
        }
        updates.statusLamellaPercent = percent;
        break;
      }
      case 'endTop': {
        updates.isEndTop = this.parseBoolean(rawValue);
        break;
      }
      case 'endBottom': {
        updates.isEndBottom = this.parseBoolean(rawValue);
        break;
      }
    }

    // Reaching an end position means the raffstore has stopped moving.
    if ((updates.isEndTop === true) || (updates.isEndBottom === true)) {
      updates.isMoving = false;
    }

    this.updateRaffstore(raffstoreId, updates);
    console.log(`[RaffstoreService] Status applied for ${raffstoreId}/${kind}: ${JSON.stringify(updates)}`);
    this.emitEvent({
      type: 'status_changed',
      raffstoreId,
      raffstore: this.raffstores.get(raffstoreId),
      timestamp: Date.now()
    });
  }

  /**
   * Parse a KNX DPT 5.001 percent value (0..100). Returns null if not parseable.
   */
  private parsePercent(rawValue: string | number | boolean): number | null {
    const num = typeof rawValue === 'number' ? rawValue : Number(rawValue);
    if (Number.isNaN(num)) {
      console.warn(`[RaffstoreService] Ignoring non-numeric percent value: ${JSON.stringify(rawValue)}`);
      return null;
    }
    return Math.min(100, Math.max(0, Math.round(num)));
  }

  /**
   * Parse a KNX DPT 1.001 boolean value.
   * WebSocket delivers native booleans; REST delivers strings.
   */
  private parseBoolean(rawValue: string | number | boolean): boolean {
    if (typeof rawValue === 'boolean') {
      return rawValue;
    }
    if (typeof rawValue === 'number') {
      return rawValue !== 0;
    }
    const normalized = String(rawValue).trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'on' || normalized === 'alarm';
  }

  /**
   * Update single raffstore
   */
  private updateRaffstore(raffstoreId: string, updates: Partial<Raffstore>): void {
    const current = this.raffstores.get(raffstoreId);
    if (current) {
      this.raffstores.set(raffstoreId, {
        ...current,
        ...updates,
        lastUpdate: new Date().toISOString()
      });
    }
  }

  /**
   * Subscribe to events
   */
  onEvent(listener: (event: Event) => void): () => void {
    this.eventListeners.push(listener);
    // Return unsubscribe function
    return () => {
      const idx = this.eventListeners.indexOf(listener);
      if (idx >= 0) {
        this.eventListeners.splice(idx, 1);
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: Event): void {
    this.events.push(event);
    for (const listener of this.eventListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('[RaffstoreService] Error in event listener:', error);
      }
    }
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 100): Event[] {
    return this.events.slice(-limit);
  }
}

/* eslint-disable @typescript-eslint/no-useless-constructor */
/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/indent */
import { App, Receiver } from '@slack/bolt';

export default class NOOPReceiver implements Receiver {
    public constructor() {
        // NOOP
    }

    public init(_app: App): void {
    }

    public async start(..._args: unknown[]): Promise<unknown> {
        return {};
     }

    public async stop(..._args: unknown[]): Promise<unknown> {
        return {};
     }
}

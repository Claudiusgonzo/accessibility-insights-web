// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.
import { CommandsAdapter } from '../../common/browser-adapters/commands-adapter';
import { getStoreStateMessage, Messages } from '../../common/messages';
import { StoreNames } from '../../common/stores/store-names';
import { PayloadWithEventName, SetLaunchPanelState } from '../actions/action-payloads';
import { CommandActions, GetCommandsPayload } from '../actions/command-actions';
import { GlobalActionHub } from '../actions/global-action-hub';
import { LaunchPanelStateActions } from '../actions/launch-panel-state-action';
import { Interpreter } from '../interpreter';
import { TelemetryEventHandler } from '../telemetry/telemetry-event-handler';

export class GlobalActionCreator {
    private interpreter: Interpreter;
    private commandsAdapter: CommandsAdapter;
    private telemetryEventHandler: TelemetryEventHandler;

    private commandActions: CommandActions;
    private launchPanelStateActions: LaunchPanelStateActions;

    constructor(
        globalActionHub: GlobalActionHub,
        interpreter: Interpreter,
        commandsAdapter: CommandsAdapter,
        telemetryEventHandler: TelemetryEventHandler,
    ) {
        this.interpreter = interpreter;
        this.commandsAdapter = commandsAdapter;
        this.telemetryEventHandler = telemetryEventHandler;
        this.commandActions = globalActionHub.commandActions;
        this.launchPanelStateActions = globalActionHub.launchPanelStateActions;
    }

    public registerCallbacks(): void {
        this.interpreter.registerTypeToPayloadCallback(
            getStoreStateMessage(StoreNames.CommandStore),
            this.onGetCommands,
        );

        this.interpreter.registerTypeToPayloadCallback(
            getStoreStateMessage(StoreNames.LaunchPanelStateStore),
            this.onGetLaunchPanelState,
        );
        this.interpreter.registerTypeToPayloadCallback(
            Messages.LaunchPanel.Set,
            this.onSetLaunchPanelState,
        );

        this.interpreter.registerTypeToPayloadCallback(
            Messages.Telemetry.Send,
            this.onSendTelemetry,
        );
    }

    private onGetCommands = (payload, tabId: number): void => {
        this.commandsAdapter.getCommands((commands: chrome.commands.Command[]) => {
            const getCommandsPayload: GetCommandsPayload = {
                commands: commands,
                tabId: tabId,
            };
            this.commandActions.getCommands.invoke(getCommandsPayload);
        });
    };

    private onGetLaunchPanelState = (): void => {
        this.launchPanelStateActions.getCurrentState.invoke(null);
    };

    private onSetLaunchPanelState = (payload: SetLaunchPanelState): void => {
        this.launchPanelStateActions.setLaunchPanelType.invoke(payload.launchPanelType);
    };

    private onSendTelemetry = (payload: PayloadWithEventName): void => {
        const eventName = payload.eventName;
        this.telemetryEventHandler.publishTelemetry(eventName, payload);
    };
}

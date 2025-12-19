import { DeviceEventEmitter } from 'react-native';

export const EVENTS = {
    DATA_REFRESH_NEEDED: 'data-refresh-needed',
};

export const eventBus = {
    emit: (event: string, data?: any) => DeviceEventEmitter.emit(event, data),
    on: (event: string, callback: (data?: any) => void) => DeviceEventEmitter.addListener(event, callback),
};

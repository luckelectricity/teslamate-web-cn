import mqtt, { MqttClient } from 'mqtt';

interface CarMqttState {
  sentry_mode?: boolean;
  locked?: boolean;
  doors_open?: boolean;
  windows_open?: boolean;
  frunk_open?: boolean;
  trunk_open?: boolean;
  battery_level?: number;
  usable_battery_level?: number;
  rated_battery_range_km?: number;
  odometer?: number;
  state?: string;
  is_climate_on?: boolean;
  outside_temp?: number;
  inside_temp?: number;
  shift_state?: string;
}

const carStates = new Map<number, CarMqttState>();
let client: MqttClient | null = null;

export function initMqtt() {
  if (client) return;

  const host = process.env.MQTT_HOST || 'teslamate-mosquitto';
  const port = process.env.MQTT_PORT || '1883';
  const url = `mqtt://${host}:${port}`;

  try {
    client = mqtt.connect(url, {
      clientId: `teslamate_cn_web_${Math.random().toString(16).slice(2, 8)}`,
      connectTimeout: 4000,
      reconnectPeriod: 5000,
    });

    client.on('connect', () => {
      console.log('Connected to TeslaMate MQTT broker at', url);
      client?.subscribe('teslamate/cars/#');
    });

    client.on('message', (topic, message) => {
      const parts = topic.split('/');
      // topic 格式: teslamate/cars/{car_id}/{key}
      if (parts.length >= 4 && parts[0] === 'teslamate' && parts[1] === 'cars') {
        const carId = parseInt(parts[2], 10);
        const key = parts.slice(3).join('_');
        const valStr = message.toString().trim();

        if (isNaN(carId)) return;
        const current = carStates.get(carId) || {};

        if (key === 'sentry_mode') {
          current.sentry_mode = valStr === 'true';
        } else if (key === 'locked') {
          current.locked = valStr === 'true';
        } else if (key === 'doors_open') {
          current.doors_open = valStr === 'true';
        } else if (key === 'trunk_open') {
          current.trunk_open = valStr === 'true';
        } else if (key === 'state') {
          current.state = valStr;
        } else if (key === 'battery_level') {
          current.battery_level = Number(valStr);
        } else if (key === 'is_climate_on') {
          current.is_climate_on = valStr === 'true';
        } else if (key === 'outside_temp') {
          current.outside_temp = Number(valStr);
        } else if (key === 'shift_state') {
          current.shift_state = valStr;
        }

        carStates.set(carId, current);
      }
    });

    client.on('error', (err) => {
      console.warn('MQTT connection warning:', err.message);
    });
  } catch (err) {
    console.warn('MQTT init failed:', err);
  }
}

// 导出获取车辆最新 MQTT 状态函数
export function getCarMqttState(carId: number = 1): CarMqttState {
  if (!client) {
    initMqtt();
  }
  return carStates.get(carId) || {};
}

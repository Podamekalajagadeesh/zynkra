import { DeviceModeBanner } from './DeviceModeBanner';
import { DeviceShell } from './DeviceShell';

export function DeviceModeRoute() {
  return (
    <DeviceShell>
      <DeviceModeBanner />
      <div className="space-y-3 rounded-2xl border border-dark-200 bg-white/70 p-4 dark:border-dark-700 dark:bg-dark-800/70">
        <div className="text-lg font-semibold">Multi-device experience ready</div>
        <p className="text-sm text-dark-600 dark:text-dark-300">
          Zynkra now adapts to desktop, tablet, TV, and smartwatch contexts with device-aware layouts, touch-friendly controls, and a compact watch interface.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl border border-dark-200 bg-dark-50 p-3 text-sm dark:border-dark-700 dark:bg-dark-900/70">
            <div className="font-medium">Desktop shell</div>
            <div className="text-dark-500 dark:text-dark-400">Keyboard and mouse-friendly navigation with a polished workspace layout.</div>
          </div>
          <div className="rounded-xl border border-dark-200 bg-dark-50 p-3 text-sm dark:border-dark-700 dark:bg-dark-900/70">
            <div className="font-medium">Portable and home experiences</div>
            <div className="text-dark-500 dark:text-dark-400">Tablet, TV, and watch modes are surfaced through responsive wrappers and adaptive cards.</div>
          </div>
        </div>
      </div>
    </DeviceShell>
  );
}

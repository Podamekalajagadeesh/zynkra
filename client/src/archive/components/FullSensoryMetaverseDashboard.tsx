import React, { useState } from 'react';
import { useFullSensoryMetaverse } from '../hooks/useFullSensoryMetaverse';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Settings } from 'lucide-react';

export const FullSensoryMetaverseDashboard: React.FC = () => {
  const { 
    state, 
    isInitialized, 
    loadEnvironment, 
    getEnvironments,
    addHaptic,
    addScent,
    addTaste,
    updateEnvironmentParameters
  } = useFullSensoryMetaverse();

  // State for sensory editing controls
  const [showSensoryEditor, setShowSensoryEditor] = useState(false);
  const [ambientTemperature, setAmbientTemperature] = useState(72); // Default room temp in F
  const [lightIntensity, setLightIntensity] = useState(80);
  const [scentIntensities, setScentIntensities] = useState<Record<string, number>>({});

  const environments = getEnvironments();

  if (!isInitialized) {
    return (
      <div className="p-6 bg-gray-900 rounded-lg">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-3"></div>
          <span className="text-white">Initializing full-sensory metaverse...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Full-Sensory Metaverse</h1>
          <p className="text-gray-400">Immersive environments that engage all five human senses</p>
        </header>

        {/* Device Status Panel */}
        <section className="mb-8 bg-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-semibold text-white mb-4">Connected Sensory Devices</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Haptic Suit */}
            <div className={`p-4 rounded-lg ${state.deviceStatus.hapticSuit.connected ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Haptic Suit</span>
                <span className={`text-xs px-2 py-1 rounded ${state.deviceStatus.hapticSuit.connected ? 'bg-green-600' : 'bg-red-600'}`}>
                  {state.deviceStatus.hapticSuit.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Battery: {state.deviceStatus.hapticSuit.batteryLevel}%</p>
              <p className="text-gray-400 text-sm">Firmware: {state.deviceStatus.hapticSuit.firmware}</p>
            </div>

            {/* Olfactory Interface */}
            <div className={`p-4 rounded-lg ${state.deviceStatus.olfactoryInterface.connected ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Olfactory Interface</span>
                <span className={`text-xs px-2 py-1 rounded ${state.deviceStatus.olfactoryInterface.connected ? 'bg-green-600' : 'bg-red-600'}`}>
                  {state.deviceStatus.olfactoryInterface.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Available scents: {state.deviceStatus.olfactoryInterface.availableScents.length}</p>
            </div>

            {/* Gustatory Interface */}
            <div className={`p-4 rounded-lg ${state.deviceStatus.gustatoryInterface.connected ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Gustatory Interface</span>
                <span className={`text-xs px-2 py-1 rounded ${state.deviceStatus.gustatoryInterface.connected ? 'bg-green-600' : 'bg-red-600'}`}>
                  {state.deviceStatus.gustatoryInterface.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Available flavors: {state.deviceStatus.gustatoryInterface.availableFlavors.length}</p>
            </div>

            {/* Neural Interface */}
            <div className={`p-4 rounded-lg ${state.deviceStatus.neuralInterface.connected ? 'bg-green-900/50 border border-green-700' : 'bg-red-900/50 border border-red-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Neural Interface</span>
                <span className={`text-xs px-2 py-1 rounded ${state.deviceStatus.neuralInterface.connected ? 'bg-green-600' : 'bg-red-600'}`}>
                  {state.deviceStatus.neuralInterface.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <p className="text-gray-400 text-sm">Latency: {state.deviceStatus.neuralInterface.latency}ms</p>
              <p className="text-gray-400 text-sm">Calibrated: {state.deviceStatus.neuralInterface.calibrationComplete ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </section>

        {/* Environment Selection */}
        <section className="mb-8 bg-gray-800 rounded-xl p-6 shadow-xl">
          <h2 className="text-2xl font-semibold text-white mb-4">Sensory Environments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {environments.map((env) => (
              <div 
                key={env.id}
                className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                  state.currentEnvironment === env.id 
                    ? 'border-blue-500 bg-blue-900/30' 
                    : 'border-gray-700 bg-gray-700/50 hover:border-gray-500'
                }`}
                onClick={() => loadEnvironment(env.id)}
              >
                <h3 className="text-xl font-medium text-white mb-2">{env.name}</h3>
                <p className="text-gray-400 mb-4">{env.description}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-purple-600 px-2 py-1 rounded text-white">
                    {env.ambientScents.length} scents
                  </span>
                  <span className="text-xs bg-orange-600 px-2 py-1 rounded text-white">
                    {env.ambientHaptics.length} haptics
                  </span>
                  <span className="text-xs bg-pink-600 px-2 py-1 rounded text-white">
                    {env.ambientVisuals.length} visuals
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Active Stimuli Panel & Sensory Editor */}
        {state.currentEnvironment && (
          <>
            {/* Sensory Content Editor - Core feature implementation */}
            <section className="mb-8 bg-gray-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Sensory Content Editor</h2>
                <Button 
                  variant="secondary" 
                  onClick={() => setShowSensoryEditor(!showSensoryEditor)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showSensoryEditor ? 'Hide Editor' : 'Show Editor'}
                </Button>
              </div>

              {showSensoryEditor && (
                <div className="space-y-8">
                  {/* Temperature Control */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">Ambient Temperature</CardTitle>
                      <CardDescription className="text-gray-400">Adjust the virtual environment's temperature</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Cold</span>
                          <span className="text-white font-medium">{ambientTemperature}°F</span>
                          <span className="text-gray-300">Hot</span>
                        </div>
                        <Slider
                          value={[ambientTemperature]}
                          min={32}
                          max={100}
                          step={1}
                          onValueChange={(value) => setAmbientTemperature(value[0])}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Light Intensity Control */}
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white">Light Intensity</CardTitle>
                      <CardDescription className="text-gray-400">Adjust the environment's overall brightness</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-300">Dark</span>
                          <span className="text-white font-medium">{lightIntensity}%</span>
                          <span className="text-gray-300">Bright</span>
                        </div>
                        <Slider
                          value={[lightIntensity]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={(value) => setLightIntensity(value[0])}
                          className="w-full"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Scent Intensity Controls */}
                  {state.activeStimuli.scents.length > 0 && (
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white">Scent Intensities</CardTitle>
                        <CardDescription className="text-gray-400">Adjust individual scent concentrations</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          {state.activeStimuli.scents.map((scent) => (
                            <div key={scent.sourceId} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-gray-300 capitalize">{scent.scentId.replace('-', ' ')}</span>
                                <span className="text-white font-medium">
                                  {(scentIntensities[scent.sourceId] ?? scent.intensity * 100).toFixed(0)}%
                                </span>
                              </div>
                              <Slider
                                value={[scentIntensities[scent.sourceId] ?? scent.intensity * 100]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={(value) => {
                                  setScentIntensities(prev => ({
                                    ...prev,
                                    [scent.sourceId]: value[0]
                                  }));
                                }}
                                className="w-full"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Apply Changes Button */}
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      if (state.currentEnvironment) {
                        // Prepare scent modifications
                        const scentModifications = Object.entries(scentIntensities).map(([sourceId, newIntensity]) => ({
                          sourceId,
                          newIntensity: newIntensity / 100,
                          newConcentration: newIntensity / 100
                        }));

                        // Apply all updates
                        updateEnvironmentParameters(state.currentEnvironment, {
                          ambientTemperature,
                          lightIntensity,
                          scentModifications: scentModifications.length > 0 ? scentModifications : undefined
                        });
                      }
                    }}
                  >
                    Apply Sensory Changes
                  </Button>
                </div>
              )}
            </section>

            {/* Active Stimuli Panel */}
            <section className="bg-gray-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-2xl font-semibold text-white mb-4">Active Sensory Stimuli</h2>
              
              {/* Active Scents */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Active Scents ({state.activeStimuli.scents.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {state.activeStimuli.scents.map((scent, idx) => (
                    <span key={idx} className="bg-purple-700 text-white px-3 py-1 rounded-full text-sm">
                      {scent.scentId} ({(scent.intensity * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Haptics */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-white mb-3">Active Haptics ({state.activeStimuli.haptics.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {state.activeStimuli.haptics.map((haptic, idx) => (
                    <span key={idx} className="bg-orange-700 text-white px-3 py-1 rounded-full text-sm">
                      {haptic.type} ({(haptic.intensity * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Active Visuals */}
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Active Visual Effects ({state.activeStimuli.visuals.length})</h3>
                <div className="flex flex-wrap gap-2">
                  {state.activeStimuli.visuals.map((visual, idx) => (
                    <span key={idx} className="bg-pink-700 text-white px-3 py-1 rounded-full text-sm">
                      {visual.type} ({(visual.intensity * 100).toFixed(0)}%)
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};
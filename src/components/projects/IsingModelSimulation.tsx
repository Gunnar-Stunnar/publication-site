'use client';

import React, { useState, useEffect } from 'react';
import _ from 'lodash';

const IsingModelSimulation = () => {
  // Grid size
  const size = 50;
  
  // Temperatures to simulate (in units of J/k_B)
  const temperatures = [1.0, 2.0, 2.269, 2.5, 3.0, 4.0];
  const criticalTemp = 2.269; // Critical temperature for 2D Ising model
  
  // Number of Monte Carlo steps per simulation
  const mcSteps = 5000;
  
  // Simulation states
  const [selectedTemp, setSelectedTemp] = useState(2.269);
  const [grid, setGrid] = useState<number[][]>([]);
  const [energy, setEnergy] = useState(0);
  const [magnetization, setMagnetization] = useState(0);
  const [correlation, setCorrelation] = useState<number[]>([]);
  const [correlationLength, setCorrelationLength] = useState(0);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [energyHistory, setEnergyHistory] = useState<number[]>([]);
  const [magHistory, setMagHistory] = useState<number[]>([]);

  // Initialize the grid
  useEffect(() => {
    initializeGrid();
  }, []);
  
  // Calculate correlation function for different distances
  const calculateCorrelation = (grid: number[][]) => {
    const maxDistance = Math.min(20, Math.floor(size / 2)); // Maximum distance to measure
    const correlations = Array(maxDistance + 1).fill(0);
    const counts = Array(maxDistance + 1).fill(0);
    
    // Sample points to calculate correlation (using a subset for efficiency)
    const sampleSize = 1000;
    
    for (let sample = 0; sample < sampleSize; sample++) {
      // Pick a random reference point
      const refI = Math.floor(Math.random() * size);
      const refJ = Math.floor(Math.random() * size);
      const refSpin = grid[refI][refJ];
      
      // Calculate correlations at different distances
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          // Calculate minimum distance considering periodic boundaries
          const di = Math.min(Math.abs(i - refI), size - Math.abs(i - refI));
          const dj = Math.min(Math.abs(j - refJ), size - Math.abs(j - refJ));
          const distance = Math.round(Math.sqrt(di * di + dj * dj));
          
          if (distance <= maxDistance) {
            correlations[distance] += refSpin * grid[i][j];
            counts[distance]++;
          }
        }
      }
    }
    
    // Normalize correlations
    const normalizedCorrelations = correlations.map((sum, idx) => 
      counts[idx] > 0 ? sum / counts[idx] : 0
    );
    
    // Estimate correlation length by finding where correlation drops to 1/e
    let corrLength = 0;
    for (let i = 1; i < normalizedCorrelations.length; i++) {
      if (normalizedCorrelations[i] < normalizedCorrelations[0] / Math.E) {
        // Linear interpolation for more precise estimate
        const x1 = i - 1;
        const x2 = i;
        const y1 = normalizedCorrelations[i - 1];
        const y2 = normalizedCorrelations[i];
        const target = normalizedCorrelations[0] / Math.E;
        
        corrLength = x1 + (target - y1) * (x2 - x1) / (y2 - y1);
        break;
      }
    }
    
    // If correlation doesn't drop to 1/e within our measurement range
    if (corrLength === 0 && normalizedCorrelations.length > 1) {
      corrLength = maxDistance; // Set to maximum measured distance as a lower bound
    }
    
    return { correlations: normalizedCorrelations, correlationLength: corrLength };
  };

  const initializeGrid = () => {
    // Create a random grid (hot start)
    const newGrid = Array(size).fill(0).map(() => 
      Array(size).fill(0).map(() => Math.random() > 0.5 ? 1 : -1)
    );
    setGrid(newGrid);
    
    // Calculate initial energy and magnetization
    const e = calculateEnergy(newGrid);
    const m = calculateMagnetization(newGrid);
    const { correlations, correlationLength } = calculateCorrelation(newGrid);
    
    setEnergy(e);
    setMagnetization(m);
    setCorrelation(correlations);
    setCorrelationLength(correlationLength);
    setEnergyHistory([e]);
    setMagHistory([m]);
    setStep(0);
  };

  // Calculate total energy of the system
  const calculateEnergy = (grid: number[][]) => {
    let energy = 0;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        // Periodic boundary conditions
        const right = (j + 1) % size;
        const below = (i + 1) % size;
        
        // Sum of interactions with right and below neighbors (to avoid double counting)
        energy -= grid[i][j] * (grid[i][right] + grid[below][j]);
      }
    }
    
    return energy;
  };

  // Calculate magnetization of the system
  const calculateMagnetization = (grid: number[][]) => {
    return _.sum(grid.flat()) / (size * size);
  };

  // Perform a single Monte Carlo step
  const monteCarloStep = () => {
    const newGrid = _.cloneDeep(grid);
    const beta = 1 / selectedTemp; // Inverse temperature
    
    // Perform size^2 spin flip attempts
    for (let attempts = 0; attempts < size * size; attempts++) {
      // Select a random site
      const i = Math.floor(Math.random() * size);
      const j = Math.floor(Math.random() * size);
      
      // Calculate energy change if we flip this spin
      const left = (j - 1 + size) % size;
      const right = (j + 1) % size;
      const above = (i - 1 + size) % size;
      const below = (i + 1) % size;
      
      const neighbors = [
        newGrid[above][j],
        newGrid[below][j],
        newGrid[i][left],
        newGrid[i][right]
      ];
      
      const delta_E = 2 * newGrid[i][j] * _.sum(neighbors);
      
      // Metropolis criterion: accept if dE < 0 or with probability exp(-beta*dE)
      if (delta_E <= 0 || Math.random() < Math.exp(-beta * delta_E)) {
        newGrid[i][j] *= -1; // Flip the spin
      }
    }
    
    // Update the grid and observables
    setGrid(newGrid);
    
    const newEnergy = calculateEnergy(newGrid);
    const newMag = calculateMagnetization(newGrid);
    
    // Calculate correlation metrics every 10 steps (for performance)
    if (step % 10 === 0) {
      const { correlations, correlationLength } = calculateCorrelation(newGrid);
      setCorrelation(correlations);
      setCorrelationLength(correlationLength);
    }
    
    setEnergy(newEnergy);
    setMagnetization(newMag);
    
    // Update histories (keep last 100 points for display)
    setEnergyHistory(prev => {
      const updated = [...prev, newEnergy];
      if (updated.length > 100) return updated.slice(-100);
      return updated;
    });
    
    setMagHistory(prev => {
      const updated = [...prev, newMag];
      if (updated.length > 100) return updated.slice(-100);
      return updated;
    });
    
    setStep(prev => prev + 1);
  };
  
  // Run/pause simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (running && step < mcSteps) {
      interval = setInterval(() => {
        monteCarloStep();
      }, 50);
    }
    
    return () => clearInterval(interval);
  }, [running, step, grid, selectedTemp]);

  // Reset simulation with new temperature
  const handleTempChange = (temp: number) => {
    setSelectedTemp(temp);
    setRunning(false);
    initializeGrid();
  };

  // Render the grid as a heatmap
  const renderGrid = () => {
    const cellSize = Math.min(8, 400 / size);
    
    return (
      <div className="grid mb-4" style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cellSize}px)` }}>
        {grid.flat().map((spin, idx) => (
          <div 
            key={idx} 
            className="cell"
            style={{
              width: `${cellSize}px`,
              height: `${cellSize}px`,
              backgroundColor: spin === 1 ? '#3b82f6' : '#f97316',
            }}
          />
        ))}
      </div>
    );
  };

  // Render a simple line chart
  const renderChart = (data: number[], label: string, color: string) => {
    const width = 400;
    const height = 100;
    const padding = 20;
    
    const values = data.slice(-100); // Show last 100 points
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;
    
    const points = values.map((val, idx) => {
      const x = padding + (idx / (values.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((val - minValue) / range) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');
    
    return (
      <div className="chart mb-4">
        <div className="font-medium text-sm mb-1">{label}</div>
        <svg width={width} height={height} className="bg-gray-100 rounded">
          <polyline
            points={points}
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Ising Model Monte Carlo Simulation</h1>
      
      <div className="mb-6">
        <p className="mb-2">
          This simulation demonstrates the phase transition in the 2D Ising model.
          The critical temperature is around 2.269 (in units of J/k_B).
        </p>
        <p className="mb-4">
          Below the critical temperature, the system exhibits spontaneous magnetization (ordered phase).
          Above the critical temperature, the system is in a disordered paramagnetic phase.
        </p>
      </div>
      
      <div className="mb-6">
        <div className="font-medium mb-2">Select Temperature (T):</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {temperatures.map(temp => (
            <button
              key={temp}
              onClick={() => handleTempChange(temp)}
              className={`px-3 py-1 rounded ${selectedTemp === temp 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {temp.toFixed(3)}
              {temp === criticalTemp && " (T_c)"}
            </button>
          ))}
        </div>
        
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setRunning(!running)}
            className={`px-4 py-2 rounded font-medium ${running 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'}`}
          >
            {running ? 'Pause' : 'Run'}
          </button>
          
          <button
            onClick={initializeGrid}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 font-medium"
          >
            Reset
          </button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="font-medium mb-2">Lattice Configuration (T = {selectedTemp.toFixed(3)}):</div>
          <div className="flex items-center justify-center bg-gray-100 p-4 rounded">
            {renderGrid()}
          </div>
          <div className="mt-2 text-center text-sm">
            <span className="inline-block w-4 h-4 bg-blue-500 mr-2"></span>Spin Up
            <span className="inline-block w-4 h-4 bg-orange-500 mx-2 ml-4"></span>Spin Down
          </div>
        </div>
        
        <div>
          <div className="mb-4">
            <div className="font-medium">Monte Carlo Steps: {step} / {mcSteps}</div>
            <div>Energy per Site: {(energy / (size * size)).toFixed(4)}</div>
            <div>Magnetization: {magnetization.toFixed(4)}</div>
            <div>Temperature: {selectedTemp.toFixed(3)}</div>
            <div className="mt-2 text-sm">
              {selectedTemp < criticalTemp 
                ? "System is below critical temperature (ordered phase)" 
                : selectedTemp > criticalTemp 
                  ? "System is above critical temperature (disordered phase)"
                  : "System is at critical temperature (phase transition)"}
            </div>
          </div>
          
          {renderChart(energyHistory, "Energy History", "#ef4444")}
          {renderChart(magHistory, "Magnetization History", "#3b82f6")}
          
          <div className="mb-4">
            <div className="font-medium text-sm mb-1">Correlation Function</div>
            <svg width={400} height={100} className="bg-gray-100 rounded">
              {correlation.length > 0 && (
                <>
                  {/* X and Y axes */}
                  <line x1="30" y1="80" x2="380" y2="80" stroke="#888" strokeWidth="1" />
                  <line x1="30" y1="10" x2="30" y2="80" stroke="#888" strokeWidth="1" />
                  
                  {/* Plot correlation function */}
                  <polyline
                    points={correlation.map((c, idx) => {
                      const x = 30 + (idx / (correlation.length - 1)) * 350;
                      const y = 80 - c * 70;
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                  />
                  
                  {/* Correlation length marker */}
                  {correlationLength > 0 && (
                    <>
                      <line 
                        x1={30 + (correlationLength / (correlation.length - 1)) * 350} 
                        y1="10" 
                        x2={30 + (correlationLength / (correlation.length - 1)) * 350} 
                        y2="80" 
                        stroke="#f97316" 
                        strokeWidth="1" 
                        strokeDasharray="4,2" 
                      />
                      <text 
                        x={30 + (correlationLength / (correlation.length - 1)) * 350 + 5} 
                        y="20" 
                        fontSize="10" 
                        fill="#f97316"
                      >
                        ξ = {correlationLength.toFixed(1)}
                      </text>
                    </>
                  )}
                  
                  {/* Axes labels */}
                  <text x="200" y="95" fontSize="10" textAnchor="middle">Distance</text>
                  <text x="15" y="45" fontSize="10" textAnchor="middle" transform="rotate(-90, 15, 45)">Correlation</text>
                </>
              )}
            </svg>
          </div>
          
          <div className="bg-purple-100 p-2 rounded border border-purple-300 text-sm mb-4">
            <div className="font-medium">Correlation Length: {correlationLength.toFixed(2)}</div>
            <div className="text-xs mt-1">
              {correlationLength > 5 
                ? "Long-range correlations indicate critical behavior" 
                : "Short correlation length indicates system is away from criticality"}
            </div>
          </div>
          
          {Math.abs(magnetization) > 0.7 && selectedTemp < criticalTemp && (
            <div className="bg-green-100 p-2 rounded border border-green-300 text-sm">
              Strong magnetization detected - system shows ordered behavior below T_c
            </div>
          )}
          
          {Math.abs(magnetization) < 0.2 && selectedTemp > criticalTemp && (
            <div className="bg-blue-100 p-2 rounded border border-blue-300 text-sm">
              Low magnetization detected - system shows disordered behavior above T_c
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>Note: This simulation uses the Metropolis algorithm for Monte Carlo sampling of the 2D Ising model with periodic boundary conditions.</p>
        <p>Each Monte Carlo step attempts to flip N² spins, where N is the lattice size.</p>
      </div>
    </div>
  );
};

export default IsingModelSimulation;
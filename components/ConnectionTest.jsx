import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../services/apiClient';
import API_BASE_URL from '../constants/api';

/**
 * Connection Test Component
 * Add this to your app to test backend connectivity
 * Usage: Import and render <ConnectionTest /> on any screen
 */
export default function ConnectionTest() {
  const [testResults, setTestResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, success, message) => {
    setTestResults(prev => [...prev, { test, success, message, time: new Date().toLocaleTimeString() }]);
  };

  const runTests = async () => {
    setTesting(true);
    setTestResults([]);

    // Test 1: Check API_BASE_URL
    addResult('Config Check', true, `API URL: ${API_BASE_URL}`);

    // Test 2: Basic fetch to health endpoint
    try {
      console.log('[TEST] Testing basic fetch to /health');
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        addResult('Health Endpoint (fetch)', true, `Status: ${response.status} - ${data.message}`);
      } else {
        addResult('Health Endpoint (fetch)', false, `Status: ${response.status}`);
      }
    } catch (error) {
      addResult('Health Endpoint (fetch)', false, error.message);
    }

    // Test 3: Test with apiClient.healthCheck()
    try {
      console.log('[TEST] Testing apiClient.healthCheck()');
      const isHealthy = await apiClient.healthCheck();
      addResult('API Client Health', isHealthy, isHealthy ? 'Backend is reachable' : 'Backend not reachable');
    } catch (error) {
      addResult('API Client Health', false, error.message);
    }

    // Test 4: Test image upload endpoint (without actual upload)
    try {
      console.log('[TEST] Testing upload endpoint accessibility');
      const response = await fetch(`${API_BASE_URL}/auth/register/images`, {
        method: 'OPTIONS', // Preflight request
      });
      addResult('Upload Endpoint', response.ok, `CORS/OPTIONS: ${response.status}`);
    } catch (error) {
      addResult('Upload Endpoint', false, error.message);
    }

    // Test 5: Test FormData creation (client-side only)
    try {
      console.log('[TEST] Testing FormData creation');
      const testFormData = new FormData();
      testFormData.append('test', 'value');
      addResult('FormData Creation', true, 'FormData can be created');
    } catch (error) {
      addResult('FormData Creation', false, error.message);
    }

    // Test 6: Network info
    try {
      const NetInfo = require('@react-native-community/netinfo').default;
      const netInfo = await NetInfo.fetch();
      addResult(
        'Network Info',
        netInfo.isConnected,
        `Type: ${netInfo.type}, Connected: ${netInfo.isConnected}, Internet: ${netInfo.isInternetReachable}`
      );
    } catch (error) {
      addResult('Network Info', false, 'NetInfo not available: ' + error.message);
    }

    setTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pulse-outline" size={32} color="#3498db" />
        <Text style={styles.title}>Connection Diagnostics</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.testButton]}
          onPress={runTests}
          disabled={testing}
        >
          <Ionicons name="play-circle-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {testing ? 'Testing...' : 'Run Tests'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={clearResults}
          disabled={testing || testResults.length === 0}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.resultsContainer}>
        {testResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="information-circle-outline" size={48} color="#95a5a6" />
            <Text style={styles.emptyText}>No tests run yet</Text>
            <Text style={styles.emptySubtext}>Tap "Run Tests" to diagnose connection</Text>
          </View>
        ) : (
          testResults.map((result, index) => (
            <View
              key={index}
              style={[
                styles.resultCard,
                result.success ? styles.successCard : styles.errorCard
              ]}
            >
              <View style={styles.resultHeader}>
                <Ionicons
                  name={result.success ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={result.success ? '#27ae60' : '#e74c3c'}
                />
                <Text style={styles.resultTitle}>{result.test}</Text>
              </View>
              <Text style={styles.resultMessage}>{result.message}</Text>
              <Text style={styles.resultTime}>{result.time}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {testResults.length > 0 && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            ✅ Passed: {testResults.filter(r => r.success).length} | 
            ❌ Failed: {testResults.filter(r => !r.success).length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ecf0f1',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: 8,
  },
  testButton: {
    backgroundColor: '#3498db',
  },
  clearButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95a5a6',
    marginTop: 4,
  },
  resultCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  successCard: {
    borderLeftColor: '#27ae60',
  },
  errorCard: {
    borderLeftColor: '#e74c3c',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  resultMessage: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  resultTime: {
    fontSize: 12,
    color: '#95a5a6',
  },
  summary: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
});
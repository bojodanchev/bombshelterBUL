import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function InfoScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>About Bomb Shelters</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryItem}>
            <View style={[styles.dot, styles.firstCategory]} />
            <Text style={styles.categoryText}>
              First Category - Excellent condition, ready for immediate use
            </Text>
          </View>
          <View style={styles.categoryItem}>
            <View style={[styles.dot, styles.secondCategory]} />
            <Text style={styles.categoryText}>
              Second Category - Good condition, ready within a week
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Types</Text>
          <Text style={styles.listItem}>• Скривалище (Shelter)</Text>
          <Text style={styles.listItem}>• Противорадиационно укритие (Anti-radiation Shelter)</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Important Information</Text>
          <Text style={styles.paragraph}>
            This app helps you locate the nearest bomb shelter in case of emergency. The map shows all registered shelters in Bulgaria, with their categories and types clearly marked.
          </Text>
          <Text style={styles.paragraph}>
            Green markers indicate Category I shelters that are immediately available, while orange markers show Category II shelters that require up to a week to prepare.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  firstCategory: {
    backgroundColor: 'green',
  },
  secondCategory: {
    backgroundColor: 'orange',
  },
  categoryText: {
    flex: 1,
    fontSize: 14,
  },
  listItem: {
    fontSize: 14,
    marginBottom: 5,
    paddingLeft: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
});
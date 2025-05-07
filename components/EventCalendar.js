import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const EventCalendar = ({ selectedDate, setSelectedDate, calendarDays }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Event calendar</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      
      {/* Days of week */}
      <View style={styles.daysRow}>
        {calendarDays.slice(0, 7).map((day, index) => (
          <Text key={`day-${index}`} style={styles.dayText}>
            {day.day}
          </Text>
        ))}
      </View>
      
      {/* Calendar dates */}
      <View style={styles.datesGrid}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={`date-${index}`}
            style={[
              styles.dateButton,
              selectedDate === day.date && styles.selectedDate,
            ]}
            onPress={() => setSelectedDate(day.date)}
          >
            <Text
              style={[
                styles.dateText,
                selectedDate === day.date && styles.selectedDateText,
              ]}
            >
              {day.date}
            </Text>
            {(day.date === 20 || day.date === 23) && (
              <View style={styles.eventIndicator} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    color: '#4fc3f7',
  },
  addButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFCB39',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#2a3a5d',
    fontWeight: 'bold',
    fontSize: 16,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayText: {
    flex: 1,
    textAlign: 'center',
    color: '#4fc3f7',
    fontSize: 12,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dateButton: {
    width: '14%',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  selectedDate: {
    backgroundColor: '#FFCB39',
  },
  dateText: {
    color: '#ffffff',
    fontSize: 14,
  },
  selectedDateText: {
    color: '#2a3a5d',
    fontWeight: 'bold',
  },
  eventIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4fc3f7',
    marginTop: 4,
  },
});

export default EventCalendar;
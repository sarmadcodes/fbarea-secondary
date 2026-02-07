import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const Skeleton = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4, 
  style = {} 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-300, 300],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            transform: [{ translateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['#E1E9EE', '#F2F8FC', '#E1E9EE']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

export const SkeletonCard = ({ style }) => (
  <View style={[styles.card, style]}>
    <View style={styles.cardHeader}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.cardContent}>
        <Skeleton width="60%" height={16} style={{ marginBottom: 8 }} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  </View>
);

export const SkeletonList = ({ count = 5 }) => (
  <View style={styles.list}>
    {[...Array(count)].map((_, index) => (
      <SkeletonCard key={index} style={{ marginBottom: 12 }} />
    ))}
  </View>
);

export const SkeletonHeader = () => (
  <View style={styles.header}>
    <Skeleton width="70%" height={28} style={{ marginBottom: 8 }} />
    <Skeleton width="50%" height={16} />
  </View>
);

export const SkeletonStats = () => (
  <View style={styles.statsContainer}>
    <View style={styles.statBox}>
      <Skeleton width={60} height={60} borderRadius={30} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 4 }} />
      <Skeleton width="60%" height={12} />
    </View>
    <View style={styles.statBox}>
      <Skeleton width={60} height={60} borderRadius={30} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 4 }} />
      <Skeleton width="60%" height={12} />
    </View>
    <View style={styles.statBox}>
      <Skeleton width={60} height={60} borderRadius={30} style={{ marginBottom: 8 }} />
      <Skeleton width="80%" height={14} style={{ marginBottom: 4 }} />
      <Skeleton width="60%" height={12} />
    </View>
  </View>
);

export const SkeletonActionCard = () => (
  <View style={styles.actionCard}>
    <Skeleton width={56} height={56} borderRadius={28} style={{ marginBottom: 8 }} />
    <Skeleton width="80%" height={12} />
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
    overflow: 'hidden',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardContent: {
    marginLeft: 12,
    flex: 1,
  },
  list: {
    paddingHorizontal: 20,
  },
  header: {
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  actionCard: {
    width: '30%',
    margin: '1.66%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default Skeleton;
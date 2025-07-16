import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Settings, Calendar, CheckCircle, XCircle, AlertCircle, Clock, Users, BookOpen, Building, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Skeleton } from '../components/Skeleton';
import { useSchoolConfig } from '../helpers/useSchoolConfig';
import { useTimetables } from '../helpers/useTimetables';
import styles from './_index.module.css';
import { Helmet } from 'react-helmet';

const HomePage = () => {
  const { data: schoolConfigData, isFetching: isConfigLoading } = useSchoolConfig();
  const { data: timetables, isFetching: isTimetablesLoading } = useTimetables(schoolConfigData?.schoolConfigId);

  const hasConfiguration = !!schoolConfigData;
  const latestTimetable = timetables?.[0];

  const getStatusBadge = (status: string | null | undefined) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      case 'in_progress':
        return <Badge variant="warning">In Progress</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">Not Generated</Badge>;
    }
  };

  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      <Helmet>
        <title>Smart Timetable Generator - Home</title>
        <meta name="description" content="Welcome to the Smart School Timetable Generator. Easily configure your school's parameters and generate optimized weekly timetables." />
      </Helmet>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Smart School Timetable Generator</h1>
          <p className={styles.subtitle}>
            Intelligently schedule teachers, classes, and rooms to create the perfect weekly timetable for your school.
          </p>
        </header>

        <main className={styles.mainContent}>
          {/* System Status Section */}
          <div className={styles.statusSection}>
            <h2 className={styles.sectionTitle}>System Status</h2>
            <div className={styles.statusGrid}>
              <div className={styles.statusCard}>
                <div className={styles.statusIcon}>
                  {isConfigLoading ? (
                    <Skeleton style={{ width: '24px', height: '24px' }} />
                  ) : hasConfiguration ? (
                    <CheckCircle size={24} className={styles.successIcon} />
                  ) : (
                    <XCircle size={24} className={styles.errorIcon} />
                  )}
                </div>
                <div className={styles.statusContent}>
                  <h3>Configuration</h3>
                  {isConfigLoading ? (
                    <Skeleton style={{ width: '100px', height: '1rem' }} />
                  ) : (
                    <p className={hasConfiguration ? styles.statusSuccess : styles.statusError}>
                      {hasConfiguration ? 'Complete' : 'Required'}
                    </p>
                  )}
                </div>
              </div>

              <div className={styles.statusCard}>
                <div className={styles.statusIcon}>
                  {isTimetablesLoading ? (
                    <Skeleton style={{ width: '24px', height: '24px' }} />
                  ) : latestTimetable ? (
                    <Calendar size={24} className={styles.primaryIcon} />
                  ) : (
                    <Clock size={24} className={styles.mutedIcon} />
                  )}
                </div>
                <div className={styles.statusContent}>
                  <h3>Latest Timetable</h3>
                  {isTimetablesLoading ? (
                    <Skeleton style={{ width: '120px', height: '1rem' }} />
                  ) : (
                    <div className={styles.timetableStatus}>
                      {getStatusBadge(latestTimetable?.generationStatus)}
                      <span className={styles.timetableDate}>
                        {formatDate(latestTimetable?.generationTimestamp)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* School Configuration Overview */}
          {hasConfiguration && schoolConfigData && (
            <div className={styles.configOverview}>
              <h2 className={styles.sectionTitle}>School Configuration</h2>
              <div className={styles.configGrid}>
                <div className={styles.configItem}>
                  <Clock size={20} />
                  <span>{schoolConfigData.schoolConfig.schoolParameters.startTime} - {schoolConfigData.schoolConfig.schoolParameters.endTime}</span>
                </div>
                <div className={styles.configItem}>
                  <Calendar size={20} />
                  <span>{schoolConfigData.schoolConfig.schoolParameters.workingDays.length} working days</span>
                </div>
                <div className={styles.configItem}>
                  <Users size={20} />
                  <span>{schoolConfigData.schoolConfig.schoolParameters.classrooms} classrooms</span>
                </div>
                <div className={styles.configItem}>
                  <BookOpen size={20} />
                  <span>{schoolConfigData.schoolConfig.teachers.length} teachers</span>
                </div>
              </div>
            </div>
          )}

          {/* Workload Balance Status */}
          {latestTimetable && (
            <div className={styles.workloadBalanceSection}>
              <h2 className={styles.sectionTitle}>
                <TrendingUp size={20} />
                Workload Balance Status
              </h2>
              <div className={styles.balanceGrid}>
                <div className={styles.balanceCard}>
                  <div className={styles.balanceIcon}>
                    <BarChart3 size={24} />
                  </div>
                  <div className={styles.balanceContent}>
                    <div className={styles.balanceStatus}>
                      <Badge variant={latestTimetable.generationStatus === 'completed' ? 'success' : 'warning'}>
                        {latestTimetable.generationStatus === 'completed' ? 'Balanced' : 'Processing'}
                      </Badge>
                    </div>
                    <div className={styles.balanceLabel}>Distribution Quality</div>
                    <div className={styles.balanceDescription}>
                      {latestTimetable.generationStatus === 'completed' 
                        ? 'Teacher workloads are optimally distributed'
                        : 'Analyzing workload distribution patterns'
                      }
                    </div>
                  </div>
                </div>
                <div className={styles.balanceCard}>
                  <div className={styles.balanceIcon}>
                    <CheckCircle size={24} />
                  </div>
                  <div className={styles.balanceContent}>
                    <div className={styles.balanceNumber}>{latestTimetable.conflictsResolved || 0}</div>
                    <div className={styles.balanceLabel}>Conflicts Resolved</div>
                    <div className={styles.balanceDescription}>
                      Scheduling conflicts automatically resolved
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Generation Results */}
          {latestTimetable && (
            <div className={styles.conflictInfo}>
              <h2 className={styles.sectionTitle}>Generation Results</h2>
              <div className={styles.conflictStats}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <CheckCircle size={20} />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statNumber}>{latestTimetable.conflictsResolved || 0}</span>
                    <span className={styles.statLabel}>Conflicts Resolved</span>
                  </div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <AlertCircle size={20} />
                  </div>
                  <div className={styles.statContent}>
                    <span className={styles.statNumber}>{latestTimetable.generationStatus === 'completed' ? 'None' : 'Pending'}</span>
                    <span className={styles.statLabel}>Active Issues</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <h2 className={styles.sectionTitle}>Quick Actions</h2>
            <div className={styles.actionGrid}>
              <Button asChild variant={hasConfiguration ? "secondary" : "primary"} size="lg">
                <Link to="/setup">
                  <Settings size={20} />
                  {hasConfiguration ? 'Update Setup' : 'Complete Setup'}
                </Link>
              </Button>
              <Button asChild variant={hasConfiguration ? "primary" : "outline"} size="lg" disabled={!hasConfiguration}>
                <Link to="/timetable">
                  <Calendar size={20} />
                  {latestTimetable ? 'View Timetable' : 'Generate Timetable'}
                </Link>
              </Button>
            </div>
          </div>

          {/* Getting Started Cards */}
          <div className={styles.cardGrid}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <Settings size={32} />
              </div>
              <h2 className={styles.cardTitle}>1. Setup Your School</h2>
              <p className={styles.cardDescription}>
                Input your school's unique parameters, including working days, class periods, teacher profiles, subjects, and special constraints.
              </p>
              <Button asChild variant="outline" className={styles.cardButton}>
                <Link to="/setup">
                  Go to Setup <ArrowRight size={16} />
                </Link>
              </Button>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>
                <Calendar size={32} />
              </div>
              <h2 className={styles.cardTitle}>2. Generate & View</h2>
              <p className={styles.cardDescription}>
                Our smart algorithm will generate an optimized, conflict-free timetable. View the complete schedule in a clear, weekly format.
              </p>
              <Button asChild variant="outline" className={styles.cardButton}>
                <Link to="/timetable">
                  View Timetable <ArrowRight size={16} />
                </Link>
              </Button>
            </div>
          </div>

          {/* CTA Section */}
          {!hasConfiguration && (
            <div className={styles.ctaSection}>
              <h2 className={styles.ctaTitle}>Ready to build your timetable?</h2>
              <p className={styles.ctaText}>
                Get started by setting up your school's details. The process is straightforward and will guide you every step of the way.
              </p>
              <Button asChild size="lg" className={styles.ctaButton}>
                <Link to="/setup">
                  Start Setup Now <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default HomePage;
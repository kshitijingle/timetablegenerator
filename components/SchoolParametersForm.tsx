import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Input } from './Input';
import { Checkbox } from './Checkbox';
import { setupFormSchema } from '../helpers/setupFormSchema';
import styles from './FormStyles.module.css';

type FormProps = {
  form: any; // UseFormReturn<z.infer<typeof setupFormSchema>>;
};

const workingDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export const SchoolParametersForm = ({ form }: FormProps) => {
  const { values, setValues } = form;

  const handleWorkingDayChange = (day: string, checked: boolean) => {
    const currentDays = values.schoolParameters.workingDays || [];
    const newDays = checked
      ? [...currentDays, day]
      : currentDays.filter((d: string) => d !== day);
    setValues((prev: any) => ({
      ...prev,
      schoolParameters: { ...prev.schoolParameters, workingDays: newDays },
    }));
  };

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>School Parameters</h2>
      <p className={styles.sectionDescription}>Define the core operational details of your school week.</p>
      
      <FormItem name="schoolParameters.workingDays">
        <FormLabel>Working Days</FormLabel>
        <div className={styles.checkboxGroup}>
          {workingDays.map(day => (
            <div key={day} className={styles.checkboxItem}>
              <FormControl>
                <Checkbox
                  id={`day-${day}`}
                  checked={values.schoolParameters.workingDays.includes(day)}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleWorkingDayChange(day, event.target.checked)}
                />
              </FormControl>
              <label htmlFor={`day-${day}`} className={styles.checkboxLabel}>{day}</label>
            </div>
          ))}
        </div>
        <FormMessage />
      </FormItem>

      <div className={styles.grid}>
        <FormItem name="schoolParameters.startTime">
          <FormLabel>Start Time</FormLabel>
          <FormControl>
            <Input
              type="time"
              value={values.schoolParameters.startTime}
              onChange={(e) => setValues((prev: any) => ({ ...prev, schoolParameters: { ...prev.schoolParameters, startTime: e.target.value } }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem name="schoolParameters.endTime">
          <FormLabel>End Time</FormLabel>
          <FormControl>
            <Input
              type="time"
              value={values.schoolParameters.endTime}
              onChange={(e) => setValues((prev: any) => ({ ...prev, schoolParameters: { ...prev.schoolParameters, endTime: e.target.value } }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>

      <div className={styles.grid}>
        <FormItem name="schoolParameters.periodDuration">
          <FormLabel>Period Duration (minutes)</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={values.schoolParameters.periodDuration}
              onChange={(e) => setValues((prev: any) => ({ ...prev, schoolParameters: { ...prev.schoolParameters, periodDuration: parseInt(e.target.value, 10) || 0 } }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem name="schoolParameters.periodsPerDay">
          <FormLabel>Periods per Day</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={values.schoolParameters.periodsPerDay}
              onChange={(e) => setValues((prev: any) => ({ ...prev, schoolParameters: { ...prev.schoolParameters, periodsPerDay: parseInt(e.target.value, 10) || 0 } }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>

      <FormItem name="schoolParameters.classrooms">
        <FormLabel>Number of Classrooms</FormLabel>
        <FormControl>
          <Input
            type="number"
            value={values.schoolParameters.classrooms}
            onChange={(e) => setValues((prev: any) => ({ ...prev, schoolParameters: { ...prev.schoolParameters, classrooms: parseInt(e.target.value, 10) || 0 } }))}
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    </div>
  );
};
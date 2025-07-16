import React from 'react';
import { z } from 'zod';
import { FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Input } from './Input';
import { Switch } from './Switch';
import { setupFormSchema } from '../helpers/setupFormSchema';
import styles from './FormStyles.module.css';

type FormProps = {
  form: any; // UseFormReturn<z.infer<typeof setupFormSchema>>;
};

export const ConstraintsForm = ({ form }: FormProps) => {
  const { values, setValues } = form;

  return (
    <div className={styles.formSection}>
      <h2 className={styles.sectionTitle}>Special Constraints</h2>
      <p className={styles.sectionDescription}>Fine-tune the timetable generation with specific rules and constraints.</p>
      
      <div className={styles.grid}>
        <FormItem name="constraints.maxConsecutiveClasses">
          <FormLabel>Max Consecutive Classes for Teachers</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={values.constraints.maxConsecutiveClasses}
              onChange={(e) => setValues((prev: any) => ({ ...prev, constraints: { ...prev.constraints, maxConsecutiveClasses: parseInt(e.target.value, 10) || 0 } }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem name="constraints.minFreePeriodsPerDay">
          <FormLabel>Min Free Periods per Day for Teachers</FormLabel>
          <FormControl>
            <Input
              type="number"
              value={values.constraints.minFreePeriodsPerDay}
              onChange={(e) => setValues((prev: any) => ({ ...prev, constraints: { ...prev.constraints, minFreePeriodsPerDay: parseInt(e.target.value, 10) || 0 } }))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </div>

      <div className={styles.switchGroup}>
        <FormItem name="constraints.allowSubjectRepetition">
          <div className={styles.switchItem}>
            <div>
              <FormLabel>Allow Subject Repetition</FormLabel>
              <FormDescription>Allow the same subject to be taught twice in one day for the same class.</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={values.constraints.allowSubjectRepetition}
                onCheckedChange={(checked) => setValues((prev: any) => ({ ...prev, constraints: { ...prev.constraints, allowSubjectRepetition: checked } }))}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>

        <FormItem name="constraints.allowCoTeaching">
          <div className={styles.switchItem}>
            <div>
              <FormLabel>Allow Co-Teaching</FormLabel>
              <FormDescription>Allow two teachers to be assigned to the same class period.</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={values.constraints.allowCoTeaching}
                onCheckedChange={(checked) => setValues((prev: any) => ({ ...prev, constraints: { ...prev.constraints, allowCoTeaching: checked } }))}
              />
            </FormControl>
          </div>
          <FormMessage />
        </FormItem>
      </div>
    </div>
  );
};
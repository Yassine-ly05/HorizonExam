import { RowDataPacket } from "mysql2";

export interface GradesModel extends RowDataPacket {
  id: number;
  exam_id: number;
  student_id: number;
  grade_value: number;
  validated: number;
  created_at: Date;
  updated_at: Date;
}

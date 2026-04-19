import { RowDataPacket } from "mysql2";

export interface ExamsModel extends RowDataPacket {
  id: number;
  course_id: number;
  title: string;
  exam_type: string;
  coefficient: number;
  created_at: Date;
  updated_at: Date;
}

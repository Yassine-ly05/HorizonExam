import { RowDataPacket } from "mysql2";

export interface CoursesModel extends RowDataPacket {
  id: number;
  code: string;
  title: string;
  credits: number;
  teacher_id: number;
  created_at: Date;
  updated_at: Date;
}

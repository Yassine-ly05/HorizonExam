import { RowDataPacket } from "mysql2";

export interface SessionsModel extends RowDataPacket {
  id: number;
  exam_id: number;
  session_date: Date;
  start_time: string;
  end_time: string;
  room: string;
  invigilator_id: number;
  created_at: Date;
  updated_at: Date;
}

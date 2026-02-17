import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Usuario {
  @PrimaryGeneratedColumn() // Genera un id autoincremental
  id: number;

  @Column({ type: 'varchar', length: 50 })
  nombre: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn() // Fecha de creación automática
  fechaCreacion: Date;

  @UpdateDateColumn() // Fecha de actualización automática
  fechaActualizacion: Date;
}

alter table states alter column "id" type varchar(4);
alter table addresses alter column "stateId" type varchar(4);
update states set id = concat('IN', id);
import * as React from "react";
import { removeMeetingFake, addMeetingFake, removeHostFake, addHostFake, getQueueFake } from "../services/api";
import { User, ManageQueue, Meeting } from "../models";
import { UserDisplay, RemoveButton, AddButton, ErrorDisplay, LoadingDisplay } from "./common";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import { pageTaskAsync } from "../utils";

interface MeetingEditorProps {
    meeting: Meeting;
    remove: () => void;
}

function MeetingEditor(props: MeetingEditorProps) {
    const user = props.meeting.attendees[0]!.user;
    return (
        <dd>
            <UserDisplay user={user}/>
            <span className="float-right">
                <RemoveButton remove={props.remove} size="sm"/>
            </span>
        </dd>
    );
}

interface HostEditorProps {
    host: User;
    remove?: () => void;
}

function HostEditor(props: HostEditorProps) {
    const removeButton = props.remove
        ? <RemoveButton remove={props.remove} size="sm"/>
        : undefined;
    return (
        <span>
            <UserDisplay user={props.host}/>
            {removeButton}
        </span>
    );
}

interface QueueEditorProps {
    queue: ManageQueue;
    addMeeting: () => void;
    removeMeeting: (m: Meeting) => void;
    addHost: () => void;
    removeHost: (h: User) => void;
}

function QueueEditor(props: QueueEditorProps) {
    const hosts = props.queue.hosts.map(h =>
        <dd>
            <HostEditor host={h} remove={() => props.removeHost(h)}/>
        </dd>
    );
    const meetings = props.queue.meetings.map(m =>
        <li className="list-group-item">
            <MeetingEditor meeting={m} remove={() => props.removeMeeting(m)}/>
        </li>
    );
    return (
        <div>
            <dl>
                <dt>ID</dt>
                <dd>{props.queue.id}</dd>
                <dt>Name</dt>
                <dd>{props.queue.name}</dd>
                <dt>Created At</dt>
                <dd>{props.queue.created_at}</dd>
                <dt>Hosted By</dt>
                {hosts}
                <AddButton add={() => props.addHost()}> Add Host</AddButton>
            </dl>
            <h3>Queued Meetings</h3>
            <ol className="list-group">
                {meetings}
            </ol>
            <AddButton add={() => props.addMeeting()}> Force Add Attendee</AddButton>
            <Link to={"/queue/" + props.queue.id}>
                See this queue as a visitor
            </Link>
        </div>
    );
}

interface QueueEditorPageProps {
    user?: User;
}

export function QueueEditorPage(props: QueueEditorPageProps) {
    const { queue_id } = useParams();
    if (queue_id === undefined) throw new Error("queue_id is undefined!");
    if (!props.user) throw new Error("user is undefined!");
    const queueIdParsed = parseInt(queue_id);
    const [queue, setQueue] = useState(undefined as ManageQueue | undefined);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(undefined as Error | undefined);
    const refresh = () => {
        pageTaskAsync(
            () => getQueueFake(queueIdParsed),
            setQueue,
            setIsLoading,
            setError,
        );
    }
    React.useEffect(() => {
        refresh();
    }, []);
    const removeHost = (h: User) => {
        pageTaskAsync(
            () => removeHostFake(queue!.id, h.username),
            setQueue,
            setIsLoading,
            setError,
        );
    }
    const addHost = () => {
        const uniqname = prompt("Uniqname?", "aaaaaaaa");
        if (!uniqname) return;
        pageTaskAsync(
            () => addHostFake(queue!.id, uniqname),
            setQueue,
            setIsLoading,
            setError,
        );
    }
    const removeMeeting = (m: Meeting) => {
        pageTaskAsync(
            () => removeMeetingFake(queue!.id, m.id),
            setQueue,
            setIsLoading,
            setError,
        );
    }
    const addMeeting = () => {
        const uniqname = prompt("Uniqname?", "johndoe");
        if (!uniqname) return;
        pageTaskAsync(
            () => addMeetingFake(queue!.id, uniqname),
            setQueue,
            setIsLoading,
            setError,
        );
    }
    const loadingDisplay = <LoadingDisplay loading={isLoading}/>
    const errorDisplay = <ErrorDisplay error={error}/>
    const queueEditor = queue
        && <QueueEditor queue={queue} 
            addHost={addHost} removeHost={removeHost} 
            addMeeting={addMeeting} removeMeeting={removeMeeting} />
    return (
        <>
        {loadingDisplay}
        {errorDisplay}
        {queueEditor}
        </>
    );
}

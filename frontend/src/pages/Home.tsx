import React from "react";
import {useGetWorkoutsQuery} from "../api/workoutApi";

//components
import WorkoutDetails from "../components/WorkoutDetails";
import WorkoutForm from "../components/WorkoutForm";

const Home = () => {
    const {data: workouts} = useGetWorkoutsQuery();

    return (
        <div style={{display: "flex", flexWrap: "wrap"}}>
            <div>
                {workouts &&
                    workouts.map((workout) => (
                        <WorkoutDetails key={workout._id} workout={workout}/>
                    ))}
            </div>
            <WorkoutForm/>
        </div>
    );
};

export default Home;

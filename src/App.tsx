import React from 'react';
import "./app.scss";
import {HrWrapper} from "./HrWrapper/HrWrapper";
import {SongDisplay, SongDisplayFromOptions} from "./SongDisplay/SongDisplay";
import { createPlaylist, localStorageKey, spotifyCachedAuth, SpotifyToken, recommend, RecommendOptions } from 'gcs-util';
import { Song } from './types/song';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import Selector from './Selector/Selector';
import SpotifyImg from "./spotify.svg";

const keys = [
	"acousticness",
	"danceability",
	"energy",
	"instrumentalness",
	"key",
	"loudness",
	"mode",
	"tempo",
	"valence"
];
const capitalize = (str: string) => `${str.slice(0,1).toUpperCase()}${str.slice(1)}`;

interface IProps{}
interface IState{
	songs: Song[],
	results: Song[],
	processing: boolean,
	saved: boolean

	acousticness: number,
	hasAcousticness: boolean,
	danceability: number,
	hasDanceability: boolean,
	energy: number,
	hasEnergy: boolean,
	instrumentalness: number,
	hasInstrumentalness: boolean,
	key: number,
	hasKey: boolean,
	loudness: number,
	hasLoudness: boolean,
	mode: boolean,
	hasMode: boolean,
	tempo: number,
	hasTempo: boolean,
	valence: number,
	hasValence: boolean,


	ids: string[],
	auth: boolean
}

export default class App extends React.Component<IProps, IState>{

	constructor(props: IProps){
		super(props);
		this.songChangeCallback = this.songChangeCallback.bind(this);
		this.proccessingCallback = this.proccessingCallback.bind(this);

		this.state = {
			songs: [],
			results: [],
			processing: false,
			saved: false,

			acousticness: 50,
			hasAcousticness: false,
			danceability: 50,
			hasDanceability: false,
			energy: 50,
			hasEnergy: false,
			instrumentalness: 50,
			hasInstrumentalness: false,
			key: 0,
			hasKey: false,
			loudness: 50,
			hasLoudness: false,
			mode: false,
			hasMode: false,
			tempo: 50,
			hasTempo: false,
			valence: 50,
			hasValence: false,
			ids: [],
			auth: false

		}
	}

	songChangeCallback(songs: Song[]){
		this.setState({songs});
		if(songs.length === 5){
			setTimeout(() => {
				const elem = document.getElementById("sliders");
				if(elem){
					elem.scrollIntoView({
						behavior: 'smooth'
					});
				}
			}, 200);
		}
	}
	proccessingCallback(processing: boolean){
		this.setState({processing});
	}

	componentDidMount(){
		if(localStorage.getItem(localStorageKey)){
			this.setState({
				auth: true
			});
		}
	}

	render(){


		const sliders = keys.map((key, i) => {
			const capKey = capitalize(key);
			return (
				<div className="row my-3">
					<h4
						className={`h3 text-gcs-${(this.state as any)[`has${capKey}`] ? "bright": "fake-elevated-2" } col-12 col-md-3 my-0`}
						onClick={() => {
							const state: any = {};
							state[`has${capKey}`] = !((this.state as any)[`has${capKey}`]);
							this.setState({...state});
						}}
					>{capKey}</h4>
					<div className={`${(this.state as any)[`has${capKey}`] ? "" : "controller-disabled"} controller col-12 col-md-8`}>
						<Slider
							min={0}
							max={key === "key" ? 11 : (key === "mode" ? 1 : 100)}
							value={(this.state as any)[key]}
							onChange={(value: number) => {
								const state: any = {};
								state[key] = value;
								state[`has${capKey}`] = true;
								this.setState({...state});
							}}
						/>
					</div>
				</div>
			);
		})

		return (
			this.state.auth
			? <div className="App">
				<div>
					<p className="text-gcs-alpine">
						Choose up to five songs to base your playlist around.
					</p>
					<Selector
						songChangeCallback={this.songChangeCallback}
						setProcessing={this.proccessingCallback} />

					<button
						disabled={this.state.songs.length === 0}
						className="bg-gcs-faded btn btn-lg"
						onClick={(e) => {
							const elem = document.getElementById("sliders");
							if(elem){
								elem.scrollIntoView({
									behavior: 'smooth'
								});
							}
						}}
					>Next</button>

				</div>
				<div id="sliders">
					<p className="text-gcs-alpine">
						Adjust the recommendation algorithm.
					</p>
					<div>
						{
							sliders
						}
					</div>
					<button
						className="mt-5 bg-gcs-faded btn btn-lg"
						onClick={(e) => {

							spotifyCachedAuth().then(token => {

								const options: RecommendOptions = {
									token: token.access,
									limit: 30,
									seed_tracks: this.state.songs.map((s: any) => s.ids[0].id),
								}

								if(this.state.hasAcousticness) options.acousticness = this.state.acousticness / 100.0;
								if(this.state.hasLoudness) options.loudness = this.state.loudness / 100.0;
								if(this.state.hasDanceability) options.danceability = this.state.danceability / 100.0;
								if(this.state.hasMode) options.mode = this.state.acousticness ? 1 : 0;
								if(this.state.hasEnergy) options.energy = this.state.energy / 100.0;
								if(this.state.hasInstrumentalness) options.instrumentalness = this.state.instrumentalness / 100.0;
								if(this.state.hasKey) options.key = this.state.key;
								if(this.state.hasTempo) options.tempo = this.state.tempo * 2;
								if(this.state.hasValence) options.valence = this.state.valence / 100.0;

								recommend(options).then(results => {

									this.setState({
										results: (results as any).songs as any as Song[]
									});
									console.dir(results);

									const elem = document.getElementById("resultsDivider");
									if(elem){
										elem.scrollIntoView({
											behavior: 'smooth'
										});
									}
								}).catch(console.error);
							});
						}}
					>Generate Playlist</button>
				</div>
				<div id="results">
					<div id="resultsDivider"className="m-5"></div>
					<button
						disabled={this.state.saved}
						className={`btn btn-${this.state.saved ? "gcs-elevated" : "success"}`}
						onClick={event => {
							spotifyCachedAuth().then((auth: SpotifyToken) => {
								const ids: string[] = this.state.results.map(s => (s as any).ids[0].id);
								createPlaylist({
									tracks: ids,
									token: auth.access,
									name: "Custom Curated Playlist",
									description: `Songs from ${this.state.songs[0].artist}, ${this.state.songs.length >= 2 ? this.state.songs[1].artist : this.state.results[1].artist}, ${this.state.songs.length >= 3 ? this.state.songs[2].artist : this.state.results[2].artist} and more!`
								}).then((res) => {
									this.setState({
										saved: true
									});
								}).catch(console.error);
							}).catch(console.error);
						}}
					>
						<div>
							<img src={SpotifyImg} />
							<span>Add To Spotify</span>
						</div>
					</button>
					<div>
						<div style={{
							height: 0
						}}>
							<SongDisplay songs={this.state.results} refresh={false} />
						</div>
					</div>
				</div>
			</div>
			: <div className="noAuth"><button
				className="btn btn-success"
				onClick={event => {
					spotifyCachedAuth().then((auth: SpotifyToken) => {
						this.setState({auth: true});
					}).catch(console.error);
				}}
			>
				<div>
					<img src="./spotify.svg" />
					<span>Login To Spotify</span>
				</div>
			</button></div>
		);
	}
}
